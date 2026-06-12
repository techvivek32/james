import type { NextPage } from "next";
import { ManagerLayout } from "../../src/portals/manager/ManagerLayout";
import { useEffect, useState, useRef } from "react";
import { UserProfile } from "../../src/types";
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
  assignedTo: string[];
};

const TaskManagerPage: NextPage = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const membersContainerRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Task> & { showAssignDropdown?: boolean }>({
    assignedOn: new Date().toISOString().split('T')[0],
    description: '',
    deadline: '',
    priority: 'medium',
    status: 'not started',
    notesByManager: '',
    documentLinkByManager: '',
    notesByUser: '',
    supportingLinksByUser: '',
    meetingLink: '',
    assignedTo: [],
    showAssignDropdown: false
  });

  useEffect(() => {
    async function loadTeamMembers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const users = await res.json();
          // Filter by sales role and managerId matching current user's id
          setTeamMembers(users.filter((u: UserProfile) => 
            u.role === "sales" && u.managerId === user?.id
          ));
        }
      } catch (error) {
        console.error("Failed to load team members:", error);
      }
    }
    if (user) {
      loadTeamMembers();
    }
  }, [user]);

  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await fetch("/api/tasks");
        if (res.ok) {
          setTasks(await res.json());
        }
      } catch (error) {
        console.error("Failed to load tasks:", error);
      }
    }
    loadTasks();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFormData(prev => ({ ...prev, showAssignDropdown: false }));
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMember = teamMembers.find(m => m.id === selectedMemberId);
  
  const selectedMemberTasks = tasks.filter(task => 
    selectedMemberId ? task.assignedTo.includes(selectedMemberId) : false
  );

  const scrollMembers = (direction: 'left' | 'right') => {
    if (membersContainerRef.current) {
      const scrollAmount = 200;
      membersContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleCreateTask = async () => {
    if (!formData.description?.trim() || !formData.deadline || !formData.assignedTo?.length) {
      alert('Please fill in all required fields: description, deadline, and assign at least one team member');
      return;
    }

    setLoading(true);
    try {
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        assignedOn: formData.assignedOn || new Date().toISOString().split('T')[0],
        description: formData.description,
        deadline: formData.deadline,
        priority: formData.priority as "low" | "medium" | "high",
        status: formData.status as "not started" | "in progress" | "blocked" | "on hold" | "done",
        notesByManager: formData.notesByManager || '',
        documentLinkByManager: formData.documentLinkByManager || '',
        notesByUser: formData.notesByUser || '',
        supportingLinksByUser: formData.supportingLinksByUser || '',
        meetingLink: formData.meetingLink || '',
        assignedTo: formData.assignedTo || []
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask)
      });

      if (res.ok) {
        const savedTask = await res.json();
        setTasks([...tasks, savedTask]);
        setShowCreateModal(false);
        // Reset form
        setFormData({
          assignedOn: new Date().toISOString().split('T')[0],
          description: '',
          deadline: '',
          priority: 'medium',
          status: 'not started',
          notesByManager: '',
          documentLinkByManager: '',
          notesByUser: '',
          supportingLinksByUser: '',
          meetingLink: '',
          assignedTo: [],
          showAssignDropdown: false
        });
      } else {
        alert("Failed to save task");
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      assignedOn: task.assignedOn,
      description: task.description,
      deadline: task.deadline,
      priority: task.priority,
      status: task.status,
      notesByManager: task.notesByManager,
      documentLinkByManager: task.documentLinkByManager,
      notesByUser: task.notesByUser,
      supportingLinksByUser: task.supportingLinksByUser,
      meetingLink: task.meetingLink,
      assignedTo: task.assignedTo,
      showAssignDropdown: false
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !formData.description?.trim() || !formData.deadline) {
      alert('Please fill in all required fields: description and deadline');
      return;
    }

    setLoading(true);
    try {
      const updatedTask: Task = {
        ...editingTask,
        assignedOn: formData.assignedOn || editingTask.assignedOn,
        description: formData.description,
        deadline: formData.deadline,
        priority: formData.priority as "low" | "medium" | "high",
        status: formData.status as "not started" | "in progress" | "blocked" | "on hold" | "done",
        notesByManager: formData.notesByManager || '',
        documentLinkByManager: formData.documentLinkByManager || '',
        notesByUser: formData.notesByUser || '',
        supportingLinksByUser: formData.supportingLinksByUser || '',
        meetingLink: formData.meetingLink || ''
      };

      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask)
      });

      if (res.ok) {
        const savedTask = await res.json();
        setTasks(tasks.map(t => t.id === savedTask.id ? savedTask : t));
        setShowEditModal(false);
        setEditingTask(null);
      } else {
        alert("Failed to update task");
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      alert("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId })
      });

      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== taskId));
      } else {
        alert("Failed to delete task");
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task");
    }
  };

  const toggleAssignedTo = (memberId: string) => {
    setFormData(prev => {
      const current = prev.assignedTo || [];
      return {
        ...prev,
        assignedTo: current.includes(memberId) 
          ? current.filter(id => id !== memberId)
          : [...current, memberId]
      };
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#10b981';
      case 'in progress': return '#3b82f6';
      case 'blocked': return '#ef4444';
      case 'on hold': return '#f59e0b';
      case 'not started': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <ManagerLayout currentView="task-manager">
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Team Tasks</h1>
        <button
          className="btn-primary btn-success"
          onClick={() => setShowCreateModal(true)}
        >
          Create Task
        </button>
      </div>
      
      <div className="panel">
        <div className="panel-header">
          <div className="panel-header-row">
            <div className="panel-header-actions" style={{ width: '100%' }}>
              <input
                className="field-input"
                placeholder="Search members by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
        <div className="panel-body">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '24px' 
          }}>
            <button
              type="button"
              onClick={() => scrollMembers('left')}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                cursor: 'pointer',
                flexShrink: 0,
                fontSize: '18px'
              }}
            >
              ‹
            </button>
            <div
              ref={membersContainerRef}
              className="hide-scrollbar"
              style={{
                display: 'flex', 
                gap: '12px', 
                overflowX: 'auto',
                flex: 1,
                padding: '4px 0',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {filteredMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: selectedMemberId === member.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                    backgroundColor: selectedMemberId === member.id ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    fontWeight: selectedMemberId === member.id ? '600' : '400',
                    color: '#374151',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {member.name}
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <div style={{ color: '#6b7280', padding: '10px' }}>
                  No team members match your search.
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => scrollMembers('right')}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                cursor: 'pointer',
                flexShrink: 0,
                fontSize: '18px'
              }}
            >
              ›
            </button>
          </div>
          
          {selectedMember && selectedMemberTasks.length > 0 && (
            <div style={{ 
              overflowX: 'auto', 
              paddingBottom: '8px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#ffffff'
            }}>
              <table style={{ width: '100%', minWidth: '1800px', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', width: '120px' }}>
                      Assigned On
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', width: '200px' }}>
                      Task Description
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', width: '120px' }}>
                      Deadline
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', width: '100px' }}>
                      Priority
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', width: '120px' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', width: '150px' }}>
                      Notes by Manager
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', width: '150px' }}>
                      Notes by User
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', width: '250px' }}>
                      Document Link by Manager
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', width: '250px' }}>
                      Supporting Links by User
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', width: '250px' }}>
                      Meeting Link
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', width: '150px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMemberTasks.map((task, index) => (
                    <tr
                      key={task.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                    >
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', fontSize: '14px', color: '#374151', whiteSpace: 'nowrap' }}>
                        {new Date(task.assignedOn).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', fontSize: '14px', color: '#111827', fontWeight: 500, wordBreak: 'break-word' }}>
                        {task.description}
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', fontSize: '14px', color: '#374151', whiteSpace: 'nowrap' }}>
                        {new Date(task.deadline).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: `${getPriorityColor(task.priority)}15`,
                            color: getPriorityColor(task.priority)
                          }}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: `${getStatusColor(task.status)}15`,
                            color: getStatusColor(task.status)
                          }}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', fontSize: '13px', color: '#374151', wordBreak: 'break-word' }}>
                        {task.notesByManager || <span style={{ color: '#9ca3af' }}>-</span>}
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', fontSize: '13px', color: '#374151', wordBreak: 'break-word' }}>
                        {task.notesByUser || <span style={{ color: '#9ca3af' }}>-</span>}
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', fontSize: '13px' }}>
                        {task.documentLinkByManager ? (
                          <a href={task.documentLinkByManager} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
                            {task.documentLinkByManager}
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', fontSize: '13px' }}>
                        {task.supportingLinksByUser ? (
                          <a href={task.supportingLinksByUser} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
                            {task.supportingLinksByUser}
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', fontSize: '13px' }}>
                        {task.meetingLink ? (
                          <a href={task.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
                            {task.meetingLink}
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', fontSize: '13px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleEditTask(task)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #3b82f6',
                              backgroundColor: '#eff6ff',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              fontWeight: 500,
                              fontSize: '13px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #ef4444',
                              backgroundColor: '#fef2f2',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontWeight: 500,
                              fontSize: '13px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {selectedMember && selectedMemberTasks.length === 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '300px',
              textAlign: 'center',
              padding: '40px'
            }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '20px',
                opacity: 0.3
              }}>
                📋
              </div>
              <h2 style={{ 
                fontSize: '32px', 
                fontWeight: 600, 
                color: '#374151',
                marginBottom: '12px'
              }}>
                {selectedMember.name}
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#6b7280',
                maxWidth: '500px'
              }}>
                This user doesn't have any tasks assigned right now.
              </p>
            </div>
          )}
          
          {!selectedMember && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '300px',
              textAlign: 'center',
              padding: '40px'
            }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '20px',
                opacity: 0.3
              }}>
                👥
              </div>
              <h2 style={{ 
                fontSize: '32px', 
                fontWeight: 600, 
                color: '#374151',
                marginBottom: '12px'
              }}>
                Select a Team Member
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#6b7280',
                maxWidth: '500px'
              }}>
                Choose a team member from above to view their tasks.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            overflowY: 'auto',
            padding: '24px 0'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '700px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600 }}>
              Create New Task
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Assigned On
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.assignedOn}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedOn: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Deadline <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="not started">Not Started</option>
                  <option value="in progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="on hold">On Hold</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Task Description <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Notes by Manager
              </label>
              <textarea
                value={formData.notesByManager}
                onChange={(e) => setFormData(prev => ({ ...prev, notesByManager: e.target.value }))}
                placeholder="Enter notes for the user"
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Document Link by Manager
              </label>
              <input
                type="text"
                value={formData.documentLinkByManager}
                onChange={(e) => setFormData(prev => ({ ...prev, documentLinkByManager: e.target.value }))}
                placeholder="Enter document URL (Loom, Google Docs, etc.)"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Notes by User
              </label>
              <textarea
                value={formData.notesByUser}
                onChange={(e) => setFormData(prev => ({ ...prev, notesByUser: e.target.value }))}
                placeholder="Enter user notes"
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Supporting Links by User
              </label>
              <input
                type="text"
                value={formData.supportingLinksByUser}
                onChange={(e) => setFormData(prev => ({ ...prev, supportingLinksByUser: e.target.value }))}
                placeholder="Enter supporting links"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Meeting Link
              </label>
              <input
                type="text"
                value={formData.meetingLink}
                onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                placeholder="Enter meeting URL"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Assign To <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, showAssignDropdown: !prev.showAssignDropdown }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {formData.assignedTo && formData.assignedTo.length > 0
                    ? teamMembers.filter(m => formData.assignedTo?.includes(m.id)).map(m => m.name).join(', ')
                    : 'Select team members...'}
                  <span style={{ float: 'right' }}>▼</span>
                </button>
                {formData.showAssignDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      right: '0',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      marginTop: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10
                    }}
                  >
                    {teamMembers.map(member => (
                      <div
                        key={member.id}
                        onClick={() => toggleAssignedTo(member.id)}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: formData.assignedTo?.includes(member.id) ? '#eff6ff' : 'transparent'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.assignedTo?.includes(member.id)}
                          onChange={() => toggleAssignedTo(member.id)}
                          style={{ margin: 0 }}
                        />
                        <span style={{ fontSize: '14px' }}>{member.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowCreateModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-success"
                onClick={handleCreateTask}
                disabled={loading}
              >
                {loading ? "Saving..." : "Create and Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            overflowY: 'auto',
            padding: '24px 0'
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '700px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600 }}>
              Edit Task
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Assigned On
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.assignedOn}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedOn: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Deadline <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="not started">Not Started</option>
                  <option value="in progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="on hold">On Hold</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Task Description <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Notes by Manager
              </label>
              <textarea
                value={formData.notesByManager}
                onChange={(e) => setFormData(prev => ({ ...prev, notesByManager: e.target.value }))}
                placeholder="Enter notes for the user"
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Document Link by Manager
              </label>
              <input
                type="text"
                value={formData.documentLinkByManager}
                onChange={(e) => setFormData(prev => ({ ...prev, documentLinkByManager: e.target.value }))}
                placeholder="Enter document URL (Loom, Google Docs, etc.)"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Notes by User
              </label>
              <textarea
                value={formData.notesByUser}
                onChange={(e) => setFormData(prev => ({ ...prev, notesByUser: e.target.value }))}
                placeholder="Enter user notes"
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Supporting Links by User
              </label>
              <input
                type="text"
                value={formData.supportingLinksByUser}
                onChange={(e) => setFormData(prev => ({ ...prev, supportingLinksByUser: e.target.value }))}
                placeholder="Enter supporting links"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                Meeting Link
              </label>
              <input
                type="text"
                value={formData.meetingLink}
                onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                placeholder="Enter meeting URL"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-success"
                onClick={handleSaveEdit}
                disabled={loading}
              >
                {loading ? "Saving..." : "Update Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
};

export default TaskManagerPage;
