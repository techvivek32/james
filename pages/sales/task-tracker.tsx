import type { NextPage } from "next";
import React, { useEffect, useState, useRef } from "react";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { useAuth } from "../../src/contexts/AuthContext";

type Task = {
  id: string;
  assignedOn: string;
  description: string;
  deadline: string;
  priority: "low" | "medium" | "high";
  status: "not started" | "in progress" | "blocked" | "on hold" | "done";
  notesByManager: string;
  documentLinkByManager: string;
  notesByUser: string;
  supportingLinksByUser: string;
  meetingLink: string;
  assignedTo: string | string[];
  customFields: Record<string, string>;
};

const TaskTracker: NextPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tableRef = useRef<HTMLTableElement>(null);
  const [columnWidths, setColumnWidths] = useState({
    assignedOn: 120,
    description: 200,
    deadline: 120,
    priority: 100,
    status: 120,
    notesByManager: 200,
    notesByUser: 200,
    documentLinkByManager: 200,
    supportingLinksByUser: 200,
    meetingLink: 150
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Load tasks assigned to the current user
  useEffect(() => {
    let mounted = true;

    async function loadTasks() {
      if (!user?.id) {
        if (mounted) setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const tasksRes = await fetch(`/api/tasks`);
        if (tasksRes.ok && mounted) {
          const data = await tasksRes.json();
          // Filter tasks assigned to the current user (handle both string and array formats)
          const userTasks = data.filter((task: Task) => {
            if (Array.isArray(task.assignedTo)) {
              return task.assignedTo.includes(user.id);
            }
            return task.assignedTo === user.id;
          });
          setTasks(userTasks);
        }
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    if (user?.id) {
      loadTasks();
    }

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Resizable column handlers
  const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizingColumn(columnKey);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnKey as keyof typeof columnWidths] || 150);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !resizingColumn) return;
    
    const newWidth = startWidth + (e.clientX - startX);
    const minWidth = 80; // Minimum column width
    if (newWidth >= minWidth) {
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth
      }));
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    setResizingColumn(null);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizingColumn, startX, startWidth]);

  // Get all unique custom field keys across all tasks
  const customFieldKeys = tasks.reduce((keys: string[], task) => {
    if (task.customFields) {
      Object.keys(task.customFields).forEach(key => {
        if (!keys.includes(key)) {
          keys.push(key);
        }
      });
    }
    return keys;
  }, []);

  // Initialize custom field widths
  useEffect(() => {
    setColumnWidths(prev => {
      const newWidths = { ...prev };
      customFieldKeys.forEach(key => {
        if (!(key in newWidths)) {
          newWidths[key as keyof typeof newWidths] = 150;
        }
      });
      return newWidths;
    });
  }, [customFieldKeys.join(',')]);

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high':
        return '#dc2626'; // red-600
      case 'medium':
        return '#d97706'; // amber-600
      case 'low':
        return '#059669'; // emerald-600
      default:
        return '#6b7280';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'done':
        return '#059669'; // emerald-600
      case 'in progress':
        return '#2563eb'; // blue-600
      case 'blocked':
        return '#dc2626'; // red-600
      case 'on hold':
        return '#d97706'; // amber-600
      case 'not started':
        return '#6b7280'; // gray-500
      default:
        return '#6b7280';
    }
  }

  if (!user) {
    return (
      <SalesLayout currentView="task-tracker">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <div style={{ color: '#6b7280' }}>Loading...</div>
          </div>
        </div>
      </SalesLayout>
    );
  }

  return (
    <SalesLayout currentView="task-tracker">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0', paddingTop: '16px' }}>
        <h1 className="page-title" style={{ marginTop: '0', marginBottom: '0' }}>My Tasks</h1>
      </div>
      
      <div className="panel" style={{ marginTop: '16px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              <div style={{ color: '#6b7280' }}>Loading tasks...</div>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ color: '#6b7280', fontSize: '18px' }}>No tasks assigned to you yet.</div>
          </div>
        ) : (
          <div style={{ 
              overflowX: 'auto', 
              paddingBottom: '8px',
              border: '2px solid #000000',
              borderRadius: '8px',
              backgroundColor: '#ffffff'
            }}>
            <table 
                ref={tableRef}
                style={{ width: '100%', minWidth: '2000px', borderCollapse: 'collapse', tableLayout: 'fixed' }}
              >
              <thead>
                <tr style={{ backgroundColor: '#000000' }}>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    border: '1px solid #ffffff', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#ffffff', 
                    whiteSpace: 'nowrap', 
                    width: `${columnWidths.assignedOn}px`,
                    position: 'relative'
                  }}>
                    Assigned On
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 1
                      }}
                      onMouseDown={(e) => handleMouseDown('assignedOn', e)}
                    />
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    border: '1px solid #ffffff', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#ffffff', 
                    whiteSpace: 'nowrap', 
                    width: `${columnWidths.description}px`,
                    position: 'relative'
                  }}>
                    Task Description
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 1
                      }}
                      onMouseDown={(e) => handleMouseDown('description', e)}
                    />
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    border: '1px solid #ffffff', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#ffffff', 
                    whiteSpace: 'nowrap', 
                    width: `${columnWidths.deadline}px`,
                    position: 'relative'
                  }}>
                    Deadline
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 1
                      }}
                      onMouseDown={(e) => handleMouseDown('deadline', e)}
                    />
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    border: '1px solid #ffffff', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#ffffff', 
                    whiteSpace: 'nowrap', 
                    width: `${columnWidths.priority}px`,
                    position: 'relative'
                  }}>
                    Priority
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 1
                      }}
                      onMouseDown={(e) => handleMouseDown('priority', e)}
                    />
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    border: '1px solid #ffffff', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#ffffff', 
                    whiteSpace: 'nowrap', 
                    width: `${columnWidths.status}px`,
                    position: 'relative'
                  }}>
                    Status
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 1
                      }}
                      onMouseDown={(e) => handleMouseDown('status', e)}
                    />
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    border: '1px solid #ffffff', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#ffffff', 
                    whiteSpace: 'nowrap', 
                    width: `${columnWidths.notesByManager}px`,
                    position: 'relative'
                  }}>
                    Notes by Manager
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 1
                      }}
                      onMouseDown={(e) => handleMouseDown('notesByManager', e)}
                    />
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    border: '1px solid #ffffff', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#ffffff', 
                    whiteSpace: 'nowrap', 
                    width: `${columnWidths.notesByUser}px`,
                    position: 'relative'
                  }}>
                    Notes by User
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 1
                      }}
                      onMouseDown={(e) => handleMouseDown('notesByUser', e)}
                    />
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    border: '1px solid #ffffff', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#ffffff', 
                    whiteSpace: 'nowrap', 
                    width: `${columnWidths.documentLinkByManager}px`,
                    position: 'relative'
                  }}>
                    Document Link by Manager
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 1
                      }}
                      onMouseDown={(e) => handleMouseDown('documentLinkByManager', e)}
                    />
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    border: '1px solid #ffffff', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#ffffff', 
                    whiteSpace: 'nowrap', 
                    width: `${columnWidths.supportingLinksByUser}px`,
                    position: 'relative'
                  }}>
                    Supporting Links by User
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 1
                      }}
                      onMouseDown={(e) => handleMouseDown('supportingLinksByUser', e)}
                    />
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left', 
                    border: '1px solid #ffffff', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#ffffff', 
                    whiteSpace: 'nowrap', 
                    width: `${columnWidths.meetingLink}px`,
                    position: 'relative'
                  }}>
                    Meeting Link
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 1
                      }}
                      onMouseDown={(e) => handleMouseDown('meetingLink', e)}
                    />
                  </th>
                  {customFieldKeys.map(key => {
                    // Initialize custom field width if not exists
                    if (!(key in columnWidths)) {
                      columnWidths[key] = 150;
                    }
                    return (
                      <th key={key} style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        border: '1px solid #ffffff', 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#ffffff', 
                        whiteSpace: 'nowrap', 
                        width: `${columnWidths[key]}px`,
                        position: 'relative'
                      }}>
                        {key}
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '5px',
                            cursor: 'col-resize',
                            backgroundColor: 'transparent',
                            zIndex: 1
                          }}
                          onMouseDown={(e) => handleMouseDown(key, e)}
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, idx) => (
                  <tr key={task.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ 
                      padding: '12px 16px', 
                      verticalAlign: 'top', 
                      fontSize: '14px', 
                      color: '#000000', 
                      whiteSpace: 'nowrap', 
                      border: '1px solid #000000',
                      width: `${columnWidths.assignedOn}px`
                    }}>
                      {new Date(task.assignedOn).toLocaleDateString()}
                    </td>
                    <td style={{ 
                      padding: '12px 16px', 
                      verticalAlign: 'top', 
                      fontSize: '14px', 
                      color: '#000000', 
                      fontWeight: 500, 
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-line',
                      border: '1px solid #000000',
                      width: `${columnWidths.description}px`
                    }}>
                      {task.description}
                    </td>
                    <td style={{ 
                      padding: '12px 16px', 
                      verticalAlign: 'top', 
                      fontSize: '14px', 
                      color: '#000000', 
                      whiteSpace: 'nowrap', 
                      border: '1px solid #000000',
                      width: `${columnWidths.deadline}px`
                    }}>
                      {new Date(task.deadline).toLocaleDateString()}
                    </td>
                    <td style={{ 
                      padding: '12px 16px', 
                      verticalAlign: 'top', 
                      whiteSpace: 'nowrap', 
                      border: '1px solid #000000',
                      width: `${columnWidths.priority}px`
                    }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: getPriorityColor(task.priority),
                            color: '#ffffff'
                          }}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ 
                      padding: '12px 16px', 
                      verticalAlign: 'top', 
                      whiteSpace: 'nowrap', 
                      border: '1px solid #000000',
                      width: `${columnWidths.status}px`
                    }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: getStatusColor(task.status),
                            color: '#ffffff'
                          }}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        verticalAlign: 'top', 
                        fontSize: '13px', 
                        color: '#000000', 
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-line',
                        border: '1px solid #000000',
                        width: `${columnWidths.notesByManager}px`
                      }}>
                        {task.notesByManager || <span style={{ color: '#9ca3af' }}>-</span>}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        verticalAlign: 'top', 
                        fontSize: '13px', 
                        color: '#000000', 
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-line',
                        border: '1px solid #000000',
                        width: `${columnWidths.notesByUser}px`
                      }}>
                        {task.notesByUser || <span style={{ color: '#9ca3af' }}>-</span>}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        verticalAlign: 'top', 
                        fontSize: '13px', 
                        color: '#000000', 
                        wordBreak: 'break-word', 
                        border: '1px solid #000000',
                        width: `${columnWidths.documentLinkByManager}px`
                      }}>
                        {task.documentLinkByManager ? (
                          <a href={task.documentLinkByManager} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
                            {task.documentLinkByManager}
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        verticalAlign: 'top', 
                        fontSize: '13px', 
                        color: '#000000', 
                        wordBreak: 'break-word', 
                        border: '1px solid #000000',
                        width: `${columnWidths.supportingLinksByUser}px`
                      }}>
                        {task.supportingLinksByUser ? (
                          <a href={task.supportingLinksByUser} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
                            {task.supportingLinksByUser}
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        verticalAlign: 'top', 
                        fontSize: '13px', 
                        color: '#000000', 
                        wordBreak: 'break-word', 
                        border: '1px solid #000000',
                        width: `${columnWidths.meetingLink}px`
                      }}>
                        {task.meetingLink ? (
                          <a href={task.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
                            {task.meetingLink}
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      {/* Custom field values */}
                      {customFieldKeys.map(key => {
                        const value = task.customFields?.[key];
                        return (
                          <td key={key} style={{ 
                            padding: '12px 16px', 
                            verticalAlign: 'top', 
                            fontSize: '13px', 
                            color: '#000000', 
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-line',
                            border: '1px solid #000000',
                            width: `${columnWidths[key] || 150}px`
                          }}>
                            {value ? (
                              (value.startsWith('http://') || value.startsWith('https://')) ? (
                                <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
                                  {value}
                                </a>
                              ) : value
                            ) : (
                              <span style={{ color: '#9ca3af' }}>-</span>
                            )}
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SalesLayout>
  );
};

export default TaskTracker;
