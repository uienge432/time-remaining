import React, { useState, useEffect } from "react";

// Define interfaces for our data structures
interface Task {
  id: number;
  name: string;
  hours: number;
  minutes: number;
}

interface NewTask {
  name: string;
  hours: number;
  minutes: number;
}

interface TimeRemaining {
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface RemainingAfterTasks {
  isOvertime: boolean;
  hours: number;
  minutes: number;
  seconds: number;
}

interface TaskBlock extends Task {
  percentage: number;
}

const TimeRemainingVisualizer: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [endHour, setEndHour] = useState<number>(() => {
    const saved = localStorage.getItem("timeApp_endHour");
    return saved !== null ? parseInt(saved, 10) : 22; // Default end time: 10 PM
  });
  const [endMinute, setEndMinute] = useState<number>(() => {
    const saved = localStorage.getItem("timeApp_endMinute");
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("timeApp_tasks");
    return saved !== null ? JSON.parse(saved) : [];
  });
  const [newTask, setNewTask] = useState<NewTask>({
    name: "",
    hours: 0,
    minutes: 30,
  });

  // Calculate start time (8 hours after end time)
  const calculateStartTime = (): { startHour: number; startMinute: number } => {
    const startHour = (endHour + 8) % 24;
    const startMinute = endMinute;
    return { startHour, startMinute };
  };

  const { startHour, startMinute } = calculateStartTime();

  // Calculate time remaining in the day
  const calculateTimeRemaining = (): TimeRemaining => {
    const now = new Date();

    // Create today's end time
    const endTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      endHour,
      endMinute
    );

    // If current time is past end time, set end time to next day
    if (now > endTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    // Time remaining in milliseconds
    const remainingMs = endTime.getTime() - now.getTime();

    return {
      totalMs: remainingMs,
      hours: Math.floor(remainingMs / (1000 * 60 * 60)),
      minutes: Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((remainingMs % (1000 * 60)) / 1000),
    };
  };

  // Calculate time that would remain after tasks
  const calculateRemainingAfterTasks = (): RemainingAfterTasks => {
    // Total task time in minutes
    const totalTaskMinutes = tasks.reduce((total, task) => {
      return total + task.hours * 60 + task.minutes;
    }, 0);

    // Convert total task time to milliseconds
    const totalTaskMs = totalTaskMinutes * 60 * 1000;

    // Remaining time after tasks
    const timeRemaining = calculateTimeRemaining();
    const remainingAfterTasks = timeRemaining.totalMs - totalTaskMs;

    if (remainingAfterTasks < 0) {
      return {
        isOvertime: true,
        hours: Math.floor(Math.abs(remainingAfterTasks) / (1000 * 60 * 60)),
        minutes: Math.floor(
          (Math.abs(remainingAfterTasks) % (1000 * 60 * 60)) / (1000 * 60)
        ),
        seconds: Math.floor(
          (Math.abs(remainingAfterTasks) % (1000 * 60)) / 1000
        ),
      };
    }

    return {
      isOvertime: false,
      hours: Math.floor(remainingAfterTasks / (1000 * 60 * 60)),
      minutes: Math.floor(
        (remainingAfterTasks % (1000 * 60 * 60)) / (1000 * 60)
      ),
      seconds: Math.floor((remainingAfterTasks % (1000 * 60)) / 1000),
    };
  };

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem("timeApp_endHour", endHour.toString());
    localStorage.setItem("timeApp_endMinute", endMinute.toString());
  }, [endHour, endMinute]);

  useEffect(() => {
    localStorage.setItem("timeApp_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format time to 12-hour format
  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
  };

  // Handle adding a new task
  const handleAddTask = (): void => {
    if (newTask.name.trim() === "") return;

    setTasks([...tasks, { ...newTask, id: Date.now() }]);
    setNewTask({ name: "", hours: 0, minutes: 30 });
  };

  // Handle removing a task
  const handleRemoveTask = (taskId: number): void => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  // Export data to JSON file
  const exportData = (): void => {
    const dataToExport = {
      endHour,
      endMinute,
      tasks,
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `time-app-data-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import data from JSON file
  const importData = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result;
        if (typeof result !== "string") return;

        const importedData = JSON.parse(result);

        if (importedData.endHour !== undefined) {
          setEndHour(importedData.endHour);
        }

        if (importedData.endMinute !== undefined) {
          setEndMinute(importedData.endMinute);
        }

        if (Array.isArray(importedData.tasks)) {
          setTasks(importedData.tasks);
        }

        alert("Data imported successfully!");
      } catch (error) {
        alert("Failed to import data. Invalid file format.");
        console.error("Import error:", error);
      }
    };

    reader.readAsText(file);
    // Reset the input value so the same file can be imported again if needed
    event.target.value = "";
  };

  // Get the time remaining info
  const timeRemaining = calculateTimeRemaining();
  const remainingAfterTasks = calculateRemainingAfterTasks();

  // Calculate task blocks for visualization
  const calculateTaskBlocks = (): TaskBlock[] => {
    const timeRemaining = calculateTimeRemaining();
    const totalRemainingMinutes =
      timeRemaining.hours * 60 + timeRemaining.minutes;

    return tasks.map((task) => {
      const taskMinutes = task.hours * 60 + task.minutes;
      return {
        ...task,
        percentage: Math.min(100, (taskMinutes / totalRemainingMinutes) * 100),
      };
    });
  };

  const taskBlocks = calculateTaskBlocks();

  return (
    <div className="flex flex-col bg-gray-50 rounded-xl shadow-lg overflow-hidden max-w-md mx-auto w-full">
      {/* Header */}
      <div className="bg-indigo-600 p-4 text-white">
        <h1 className="text-xl font-bold mb-1">Time Remaining Today</h1>
        <div className="text-indigo-100 text-sm">
          Your day: {formatTime(startHour, startMinute)} –{" "}
          {formatTime(endHour, endMinute)}
        </div>
      </div>

      {/* Time settings */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between">
          <div className="text-sm text-gray-500 mr-2 mb-1">
            End your day at:
          </div>
          <div className="flex items-center">
            <select
              value={endHour}
              onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
              className="mx-1 p-1 border rounded bg-white text-sm"
              aria-label="Hour"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={`hour-${i}`} value={i}>
                  {i % 12 || 12}
                </option>
              ))}
            </select>
            <span>:</span>
            <select
              value={endMinute}
              onChange={(e) => setEndMinute(parseInt(e.target.value, 10))}
              className="mx-1 p-1 border rounded bg-white text-sm"
              aria-label="Minute"
            >
              {[0, 15, 30, 45].map((i) => (
                <option key={`minute-${i}`} value={i}>
                  {String(i).padStart(2, "0")}
                </option>
              ))}
            </select>
            <span>{endHour >= 12 ? "PM" : "AM"}</span>
          </div>
        </div>
      </div>

      {/* Time display */}
      <div className="flex justify-between p-4 bg-white">
        <div className="flex flex-col items-center">
          <div className="text-gray-500 text-sm mb-1">Current Time</div>
          <div className="text-lg font-semibold">
            {formatTime(currentTime.getHours(), currentTime.getMinutes())}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-gray-500 text-sm mb-1">Time Remaining</div>
          <div className="text-lg font-semibold text-indigo-700">
            {timeRemaining.hours}h {timeRemaining.minutes}m
          </div>
        </div>
      </div>

      {/* Time visualization */}
      <div className="p-4 bg-indigo-50">
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-indigo-600 rounded-full"
            style={{
              width: `${Math.min(
                100,
                100 - (timeRemaining.totalMs / (16 * 60 * 60 * 1000)) * 100
              )}%`,
            }}
          ></div>
        </div>

        <div className="text-xs text-gray-500 mb-2">
          Time used today (progress toward {formatTime(endHour, endMinute)})
        </div>
      </div>

      {/* Task management */}
      <div className="p-4 bg-white border-t border-gray-200">
        <h2 className="text-lg font-semibold mb-3">Plan Your Remaining Time</h2>

        {/* Add task form */}
        <div className="flex flex-col mb-4">
          <div className="flex mb-2">
            <input
              type="text"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
              placeholder="Add a task..."
              className="flex-grow p-2 text-sm border rounded-l"
            />
            <button
              onClick={handleAddTask}
              className="p-2 bg-indigo-600 text-white font-medium text-sm rounded-r"
              disabled={!newTask.name.trim()}
            >
              Add
            </button>
          </div>
          <div className="flex">
            <div className="w-1/2 pr-1">
              <select
                value={newTask.hours}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    hours: parseInt(e.target.value, 10),
                  })
                }
                className="w-full p-2 text-sm border rounded bg-white"
                aria-label="Hours"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={`th-${i}`} value={i}>
                    {i} hour{i !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-1/2 pl-1">
              <select
                value={newTask.minutes}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    minutes: parseInt(e.target.value, 10),
                  })
                }
                className="w-full p-2 text-sm border rounded bg-white"
                aria-label="Minutes"
              >
                {[0, 15, 30, 45].map((i) => (
                  <option key={`tm-${i}`} value={i}>
                    {i} minute{i !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Task list */}
        {tasks.length > 0 ? (
          <div className="mb-4">
            <div className="mb-2 flex justify-between text-sm text-gray-500">
              <div>Tasks</div>
              <div>Time</div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex justify-between items-center p-2 border-b"
                >
                  <div className="flex-grow font-medium text-sm truncate mr-2">
                    {task.name}
                  </div>
                  <div className="text-gray-600 text-sm whitespace-nowrap mr-2">
                    {task.hours}h {task.minutes}m
                  </div>
                  <button
                    onClick={() => handleRemoveTask(task.id)}
                    className="text-red-500 text-sm p-1 w-8 h-8 flex items-center justify-center"
                    aria-label="Remove task"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-center py-4 text-sm">
            No tasks added yet
          </div>
        )}

        {/* Time after tasks summary */}
        {tasks.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">
              After completing all tasks:
            </div>
            <div className="text-lg font-bold flex items-center">
              {remainingAfterTasks.isOvertime ? (
                <span className="text-red-600">
                  Overtime by {remainingAfterTasks.hours}h{" "}
                  {remainingAfterTasks.minutes}m
                </span>
              ) : (
                <span className="text-green-600">
                  {remainingAfterTasks.hours}h {remainingAfterTasks.minutes}m
                  remaining
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tasks visualization */}
      {tasks.length > 0 && (
        <div className="p-4 bg-indigo-50 border-t border-gray-200">
          <div className="text-sm text-gray-500 mb-2">
            How your tasks use remaining time:
          </div>
          <div className="w-full h-6 bg-gray-200 rounded-lg overflow-hidden flex">
            {taskBlocks.map((task, index) => (
              <div
                key={task.id}
                className="h-full"
                style={{
                  width: `${task.percentage}%`,
                  backgroundColor: `hsl(${220 + index * 30}, 70%, 60%)`,
                  minWidth: "8px",
                }}
                title={`${task.name}: ${task.hours}h ${task.minutes}m`}
              ></div>
            ))}

            {!remainingAfterTasks.isOvertime && (
              <div
                className="h-full bg-green-300"
                style={{
                  flexGrow: 1,
                }}
              ></div>
            )}
          </div>
          <div className="flex text-xs mt-2 flex-wrap">
            {taskBlocks.map((task, index) => (
              <div
                key={`legend-${task.id}`}
                className="flex items-center mr-3 mb-1"
              >
                <div
                  className="w-3 h-3 mr-1 rounded-sm"
                  style={{
                    backgroundColor: `hsl(${220 + index * 30}, 70%, 60%)`,
                  }}
                ></div>
                <span className="truncate max-w-16">{task.name}</span>
              </div>
            ))}
            {!remainingAfterTasks.isOvertime && (
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 mr-1 rounded-sm bg-green-300"></div>
                <span>Free time</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data management */}
      <div className="p-3 bg-gray-100 border-t border-gray-200 flex flex-wrap justify-between items-center">
        <div className="text-xs text-gray-500 mb-1 mr-2">
          Data is saved to your browser
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200">
            Import
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>
          <button
            onClick={exportData}
            className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeRemainingVisualizer;
