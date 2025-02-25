import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
const TimeRemainingVisualizer = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [endHour, setEndHour] = useState(() => {
        const saved = localStorage.getItem("timeApp_endHour");
        return saved !== null ? parseInt(saved, 10) : 22; // Default end time: 10 PM
    });
    const [endMinute, setEndMinute] = useState(() => {
        const saved = localStorage.getItem("timeApp_endMinute");
        return saved !== null ? parseInt(saved, 10) : 0;
    });
    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem("timeApp_tasks");
        return saved !== null ? JSON.parse(saved) : [];
    });
    const [newTask, setNewTask] = useState({ name: "", hours: 0, minutes: 30 });
    // Calculate start time (8 hours after end time)
    const calculateStartTime = () => {
        const startHour = (endHour + 8) % 24;
        const startMinute = endMinute;
        return { startHour, startMinute };
    };
    const { startHour, startMinute } = calculateStartTime();
    // Calculate time remaining in the day
    const calculateTimeRemaining = () => {
        const now = new Date();
        // Create today's end time
        const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMinute);
        // If current time is past end time, set end time to next day
        if (now > endTime) {
            endTime.setDate(endTime.getDate() + 1);
        }
        // Time remaining in milliseconds
        const remainingMs = endTime - now;
        return {
            totalMs: remainingMs,
            hours: Math.floor(remainingMs / (1000 * 60 * 60)),
            minutes: Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((remainingMs % (1000 * 60)) / 1000),
        };
    };
    // Calculate time that would remain after tasks
    const calculateRemainingAfterTasks = () => {
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
                minutes: Math.floor((Math.abs(remainingAfterTasks) % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((Math.abs(remainingAfterTasks) % (1000 * 60)) / 1000),
            };
        }
        return {
            isOvertime: false,
            hours: Math.floor(remainingAfterTasks / (1000 * 60 * 60)),
            minutes: Math.floor((remainingAfterTasks % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((remainingAfterTasks % (1000 * 60)) / 1000),
        };
    };
    // Save to localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem("timeApp_endHour", endHour);
        localStorage.setItem("timeApp_endMinute", endMinute);
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
    const formatTime = (hour, minute) => {
        const period = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
    };
    // Handle adding a new task
    const handleAddTask = () => {
        if (newTask.name.trim() === "")
            return;
        setTasks([...tasks, { ...newTask, id: Date.now() }]);
        setNewTask({ name: "", hours: 0, minutes: 30 });
    };
    // Handle removing a task
    const handleRemoveTask = (taskId) => {
        setTasks(tasks.filter((task) => task.id !== taskId));
    };
    // Export data to JSON file
    const exportData = () => {
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
        link.download = `time-app-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    // Import data from JSON file
    const importData = (event) => {
        const file = event.target.files[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
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
            }
            catch (error) {
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
    const calculateTaskBlocks = () => {
        const timeRemaining = calculateTimeRemaining();
        const totalRemainingMinutes = timeRemaining.hours * 60 + timeRemaining.minutes;
        return tasks.map((task) => {
            const taskMinutes = task.hours * 60 + task.minutes;
            return {
                ...task,
                percentage: Math.min(100, (taskMinutes / totalRemainingMinutes) * 100),
            };
        });
    };
    const taskBlocks = calculateTaskBlocks();
    return (_jsxs("div", { className: "flex flex-col bg-gray-50 rounded-xl shadow-lg overflow-hidden max-w-md mx-auto w-full", children: [_jsxs("div", { className: "bg-indigo-600 p-4 text-white", children: [_jsx("h1", { className: "text-xl font-bold mb-1", children: "Time Remaining Today" }), _jsxs("div", { className: "text-indigo-100 text-sm", children: ["Your day: ", formatTime(startHour, startMinute), " \u2013", " ", formatTime(endHour, endMinute)] })] }), _jsx("div", { className: "px-4 py-3 border-b border-gray-200", children: _jsxs("div", { className: "flex flex-wrap items-center justify-between", children: [_jsx("div", { className: "text-sm text-gray-500 mr-2 mb-1", children: "End your day at:" }), _jsxs("div", { className: "flex items-center", children: [_jsx("select", { value: endHour, onChange: (e) => setEndHour(parseInt(e.target.value, 10)), className: "mx-1 p-1 border rounded bg-white text-sm", "aria-label": "Hour", children: Array.from({ length: 24 }, (_, i) => (_jsx("option", { value: i, children: i % 12 || 12 }, `hour-${i}`))) }), _jsx("span", { children: ":" }), _jsx("select", { value: endMinute, onChange: (e) => setEndMinute(parseInt(e.target.value, 10)), className: "mx-1 p-1 border rounded bg-white text-sm", "aria-label": "Minute", children: [0, 15, 30, 45].map((i) => (_jsx("option", { value: i, children: String(i).padStart(2, "0") }, `minute-${i}`))) }), _jsx("span", { children: endHour >= 12 ? "PM" : "AM" })] })] }) }), _jsxs("div", { className: "flex justify-between p-4 bg-white", children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "text-gray-500 text-sm mb-1", children: "Current Time" }), _jsx("div", { className: "text-lg font-semibold", children: formatTime(currentTime.getHours(), currentTime.getMinutes()) })] }), _jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "text-gray-500 text-sm mb-1", children: "Time Remaining" }), _jsxs("div", { className: "text-lg font-semibold text-indigo-700", children: [timeRemaining.hours, "h ", timeRemaining.minutes, "m"] })] })] }), _jsxs("div", { className: "p-4 bg-indigo-50", children: [_jsx("div", { className: "w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-2", children: _jsx("div", { className: "h-full bg-indigo-600 rounded-full", style: {
                                width: `${Math.min(100, 100 - (timeRemaining.totalMs / (16 * 60 * 60 * 1000)) * 100)}%`,
                            } }) }), _jsxs("div", { className: "text-xs text-gray-500 mb-2", children: ["Time used today (progress toward ", formatTime(endHour, endMinute), ")"] })] }), _jsxs("div", { className: "p-4 bg-white border-t border-gray-200", children: [_jsx("h2", { className: "text-lg font-semibold mb-3", children: "Plan Your Remaining Time" }), _jsxs("div", { className: "flex flex-col mb-4", children: [_jsxs("div", { className: "flex mb-2", children: [_jsx("input", { type: "text", value: newTask.name, onChange: (e) => setNewTask({ ...newTask, name: e.target.value }), placeholder: "Add a task...", className: "flex-grow p-2 text-sm border rounded-l" }), _jsx("button", { onClick: handleAddTask, className: "p-2 bg-indigo-600 text-white font-medium text-sm rounded-r", disabled: !newTask.name.trim(), children: "Add" })] }), _jsxs("div", { className: "flex", children: [_jsx("div", { className: "w-1/2 pr-1", children: _jsx("select", { value: newTask.hours, onChange: (e) => setNewTask({
                                                ...newTask,
                                                hours: parseInt(e.target.value, 10),
                                            }), className: "w-full p-2 text-sm border rounded bg-white", "aria-label": "Hours", children: Array.from({ length: 12 }, (_, i) => (_jsxs("option", { value: i, children: [i, " hour", i !== 1 ? "s" : ""] }, `th-${i}`))) }) }), _jsx("div", { className: "w-1/2 pl-1", children: _jsx("select", { value: newTask.minutes, onChange: (e) => setNewTask({
                                                ...newTask,
                                                minutes: parseInt(e.target.value, 10),
                                            }), className: "w-full p-2 text-sm border rounded bg-white", "aria-label": "Minutes", children: [0, 15, 30, 45].map((i) => (_jsxs("option", { value: i, children: [i, " minute", i !== 1 ? "s" : ""] }, `tm-${i}`))) }) })] })] }), tasks.length > 0 ? (_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "mb-2 flex justify-between text-sm text-gray-500", children: [_jsx("div", { children: "Tasks" }), _jsx("div", { children: "Time" })] }), _jsx("div", { className: "max-h-48 overflow-y-auto", children: tasks.map((task) => (_jsxs("div", { className: "flex justify-between items-center p-2 border-b", children: [_jsx("div", { className: "flex-grow font-medium text-sm truncate mr-2", children: task.name }), _jsxs("div", { className: "text-gray-600 text-sm whitespace-nowrap mr-2", children: [task.hours, "h ", task.minutes, "m"] }), _jsx("button", { onClick: () => handleRemoveTask(task.id), className: "text-red-500 text-sm p-1 w-8 h-8 flex items-center justify-center", "aria-label": "Remove task", children: "\u2715" })] }, task.id))) })] })) : (_jsx("div", { className: "text-gray-400 text-center py-4 text-sm", children: "No tasks added yet" })), tasks.length > 0 && (_jsxs("div", { className: "mt-4 p-3 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "text-sm text-gray-500 mb-1", children: "After completing all tasks:" }), _jsx("div", { className: "text-lg font-bold flex items-center", children: remainingAfterTasks.isOvertime ? (_jsxs("span", { className: "text-red-600", children: ["Overtime by ", remainingAfterTasks.hours, "h", " ", remainingAfterTasks.minutes, "m"] })) : (_jsxs("span", { className: "text-green-600", children: [remainingAfterTasks.hours, "h ", remainingAfterTasks.minutes, "m remaining"] })) })] }))] }), tasks.length > 0 && (_jsxs("div", { className: "p-4 bg-indigo-50 border-t border-gray-200", children: [_jsx("div", { className: "text-sm text-gray-500 mb-2", children: "How your tasks use remaining time:" }), _jsxs("div", { className: "w-full h-6 bg-gray-200 rounded-lg overflow-hidden flex", children: [taskBlocks.map((task, index) => (_jsx("div", { className: "h-full", style: {
                                    width: `${task.percentage}%`,
                                    backgroundColor: `hsl(${220 + index * 30}, 70%, 60%)`,
                                    minWidth: "8px",
                                }, title: `${task.name}: ${task.hours}h ${task.minutes}m` }, task.id))), !remainingAfterTasks.isOvertime && (_jsx("div", { className: "h-full bg-green-300", style: {
                                    flexGrow: 1,
                                } }))] }), _jsxs("div", { className: "flex text-xs mt-2 flex-wrap", children: [taskBlocks.map((task, index) => (_jsxs("div", { className: "flex items-center mr-3 mb-1", children: [_jsx("div", { className: "w-3 h-3 mr-1 rounded-sm", style: {
                                            backgroundColor: `hsl(${220 + index * 30}, 70%, 60%)`,
                                        } }), _jsx("span", { className: "truncate max-w-16", children: task.name })] }, `legend-${task.id}`))), !remainingAfterTasks.isOvertime && (_jsxs("div", { className: "flex items-center mb-1", children: [_jsx("div", { className: "w-3 h-3 mr-1 rounded-sm bg-green-300" }), _jsx("span", { children: "Free time" })] }))] })] })), _jsxs("div", { className: "p-3 bg-gray-100 border-t border-gray-200 flex flex-wrap justify-between items-center", children: [_jsx("div", { className: "text-xs text-gray-500 mb-1 mr-2", children: "Data is saved to your browser" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("label", { className: "cursor-pointer px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200", children: ["Import", _jsx("input", { type: "file", accept: ".json", onChange: importData, className: "hidden" })] }), _jsx("button", { onClick: exportData, className: "px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700", children: "Export" })] })] })] }));
};
export default TimeRemainingVisualizer;
