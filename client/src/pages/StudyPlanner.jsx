import React, { useState, useEffect } from 'react';

const StudyPlanner = () => {
  // State for weeks, tasks, modal visibility and new task data
  const [weeks, setWeeks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskWeek, setNewTaskWeek] = useState(1);

  // Function to get formatted date range for a week
  const getDateRangeForWeek = (weekNumber) => {
    const today = new Date();
    // Calculate the first day of the current week (Sunday)
    const currentDay = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const firstDayOfCurrentWeek = new Date(today);
    firstDayOfCurrentWeek.setDate(today.getDate() - currentDay);
    
    // Calculate the start date for the requested week
    const startDate = new Date(firstDayOfCurrentWeek);
    startDate.setDate(firstDayOfCurrentWeek.getDate() + (weekNumber - 1) * 7);
    
    // Calculate the end date (6 days after start date)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Format the dates
    const startMonth = startDate.toLocaleString('default', { month: 'long' });
    const endMonth = endDate.toLocaleString('default', { month: 'long' });
    
    // If same month, return "Month StartDay-EndDay"
    if (startMonth === endMonth) {
      return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}`;
    }
    // If different months, return "StartMonth StartDay - EndMonth EndDay"
    return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`;
  };

  // Initialize with first two weeks on component mount
  useEffect(() => {
    initializeWeeks();
  }, []);

  // Initialize the first two weeks
  const initializeWeeks = () => {
    const initialWeeks = [
      { id: 1, name: 'Week 1', date: getDateRangeForWeek(1) },
      { id: 2, name: 'Week 2', date: getDateRangeForWeek(2) }
    ];
    
    const initialTasks = [
      { id: 1, name: 'Test 1', week: 1, completed: false },
      { id: 2, name: 'Test 2', week: 2, completed: false }
    ];
    
    setWeeks(initialWeeks);
    setTasks(initialTasks);
    setNewTaskWeek(1);
  };

  // Add a new week
  const addWeek = () => {
    const newWeekId = weeks.length > 0 ? Math.max(...weeks.map(w => w.id)) + 1 : 1;
    const weekNumber = newWeekId;
    const date = getDateRangeForWeek(weekNumber);
    setWeeks([...weeks, { id: newWeekId, name: `Week ${weekNumber}`, date }]);
  };

  // Add a new task
  const addTask = () => {
    if (newTaskName.trim()) {
      const newTaskId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
      setTasks([...tasks, { 
        id: newTaskId, 
        name: newTaskName, 
        week: newTaskWeek,
        completed: false 
      }]);
      setNewTaskName('');
      setShowModal(false);
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // Delete a task
  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 p-2 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header/Navigation Bar */}
        <div className="border border-gray-300 rounded-md p-2 mb-4 md:mb-6 flex justify-between items-center bg-[#f8f8ec]">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-gray-400 flex items-center justify-center hover:border-[#c4e456] transition-colors duration-200">
              B
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="p-1 sm:p-2 border border-gray-400 rounded-md hover:border-[#c4e456] hover:text-[#c4e456] transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
            <button className="p-1 sm:p-2 border border-gray-400 rounded-md hover:border-[#c4e456] hover:text-[#c4e456] transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              className="p-1 sm:p-2 border border-gray-400 rounded-md hover:border-[#c4e456] hover:text-[#c4e456] transition-colors duration-200"
              onClick={() => setShowModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <button className="p-1 sm:p-2 border border-gray-400 rounded-md hover:border-[#c4e456] hover:text-[#c4e456] transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {/* DSA Card - At top as requested */}
          <div className="col-span-1">
            <div className="border border-gray-300 rounded-md p-3 sm:p-4 mb-4 md:mb-6 hover:border-[#c4e456] transition-colors duration-300 bg-[#f8f8ec]">
              <h2 className="text-lg sm:text-xl mb-3 sm:mb-4 font-medium text-[#c4e456]">DSA</h2>
              
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <div className="mb-3 sm:mb-0">
                  {/* Weeks X/Y */}
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base mb-2">Weeks {weeks.length}/{weeks.length + 2} weeks</h3>
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-[#c4e456] mr-2"></div>
                      <span className="text-sm sm:text-base">Created by John</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:items-end">
                  {/* Members */}
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base mb-2">Members: XX</h3>
                    <div className="flex mt-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 border border-white -ml-2 first:ml-0 flex items-center justify-center text-xs">
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 border border-white -ml-2 flex items-center justify-center text-xs">
                        +5
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <div className="mt-2 w-full sm:w-48">
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.floor(tasks.filter(t => t.completed).length / Math.max(tasks.length, 1) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#c4e456] rounded-full" 
                        style={{ width: `${Math.floor(tasks.filter(t => t.completed).length / Math.max(tasks.length, 1) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Weeks Section with Action Buttons */}
          <div className="col-span-1 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg sm:text-xl font-medium">Weeks</h2>
              <div className="flex space-x-2">
                <button 
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-[#c4e456] text-gray-800 rounded-md hover:bg-opacity-90 transition-colors duration-200"
                  onClick={() => setShowModal(true)}
                >
                  Add Task
                </button>
                <button 
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 border border-gray-400 rounded-md hover:border-[#c4e456] hover:text-[#c4e456] transition-colors duration-200"
                  onClick={addWeek}
                >
                  Add Week
                </button>
              </div>
            </div>
            
            {/* Week Cards - Vertically Scrollable */}
            <div className="max-h-[600px] overflow-y-auto pr-2">
              {weeks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 w-full">
                  No weeks yet. Click "Add Week" to create one.
                </div>
              ) : (
                weeks.map((week) => (
                  <div key={week.id} className="mb-4">
                    <div className="border border-gray-300 rounded-md bg-[#f8f8ec]">
                      <div className="p-3 sm:p-4 border-b border-gray-300">
                        <h3 className="text-base sm:text-lg font-medium">{week.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{week.date}</p>
                        <div className="mt-2 text-xs sm:text-sm text-gray-600">
                          {tasks.filter(t => t.week === week.id).length} tasks
                        </div>
                      </div>
                      
                      <div className="p-3 sm:p-4">
                        {tasks.filter(task => task.week === week.id).length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">
                            No tasks for this week
                          </div>
                        ) : (
                          tasks
                            .filter(task => task.week === week.id)
                            .map((task) => (
                              <div 
                                key={task.id} 
                                className="py-2 flex justify-between items-center group hover:bg-white rounded-md px-2 mb-2"
                              >
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    className="mr-3 h-3 w-3 sm:h-4 sm:w-4 rounded border-gray-300 text-[#c4e456] focus:ring-[#c4e456]" 
                                    checked={task.completed}
                                    onChange={() => toggleTaskCompletion(task.id)}
                                  />
                                  <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button 
                                    className="text-xs px-2 py-1 bg-[#c4e456] text-gray-800 rounded hover:bg-opacity-90 transition-colors duration-200"
                                  >
                                    Take Test
                                  </button>
                                  <button 
                                    className="text-xs p-1 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity duration-200"
                                    onClick={() => deleteTask(task.id)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#f8f8ec] rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md border border-gray-300 text-gray-800">
            <h3 className="text-lg sm:text-xl mb-4 font-medium">Add New Task</h3>
            <input
              type="text"
              className="w-full bg-white border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:border-[#c4e456] text-sm sm:text-base"
              placeholder="Enter task name"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
            />
            
            <div className="mb-4">
              <label className="block text-xs sm:text-sm mb-2">Select Week</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:border-[#c4e456] text-sm sm:text-base"
                value={newTaskWeek}
                onChange={(e) => setNewTaskWeek(parseInt(e.target.value))}
              >
                {weeks.map(week => (
                  <option key={week.id} value={week.id}>
                    {week.name} ({week.date})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="px-3 py-1 sm:px-4 sm:py-2 border border-gray-300 rounded-md hover:border-gray-500 transition-colors duration-200 text-sm sm:text-base"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-3 py-1 sm:px-4 sm:py-2 bg-[#c4e456] text-gray-800 rounded-md hover:bg-opacity-90 transition-colors duration-200 text-sm sm:text-base"
                onClick={addTask}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;