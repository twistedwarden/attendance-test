import { useState } from 'react';
import { Send, MessageSquare, Phone, Mail, Search, Filter } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface Message {
  id: string;
  studentName: string;
  parentName: string;
  parentContact: string;
  message: string;
  type: 'attendance' | 'behavior' | 'academic' | 'general';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

const mockMessages: Message[] = [
  {
    id: '1',
    studentName: 'Emma Johnson',
    parentName: 'Robert Johnson',
    parentContact: '+1 (555) 123-4567',
    message: 'Emma has been doing excellent work in class this week!',
    type: 'academic',
    timestamp: '2024-01-15 10:30 AM',
    status: 'read'
  },
  {
    id: '2',
    studentName: 'Michael Chen',
    parentName: 'Lisa Chen',
    parentContact: '+1 (555) 234-5678',
    message: 'Michael arrived late today at 8:35 AM.',
    type: 'attendance',
    timestamp: '2024-01-15 8:40 AM',
    status: 'delivered'
  },
  {
    id: '3',
    studentName: 'Sarah Davis',
    parentName: 'Mark Davis',
    parentContact: '+1 (555) 345-6789',
    message: 'Sarah showed great leadership during group activities today.',
    type: 'behavior',
    timestamp: '2024-01-14 3:15 PM',
    status: 'read'
  }
];

export default function TeacherNotificationsView() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipient: '',
    type: 'general',
    message: ''
  });

  const filteredMessages = mockMessages.filter(message => {
    const matchesSearch = message.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || message.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'behavior':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'academic':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'general':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-yellow-600';
      case 'delivered':
        return 'text-blue-600';
      case 'read':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleSendMessage = () => {
    // Handle sending message
    console.log('Sending message:', newMessage);
    setShowComposeModal(false);
    setNewMessage({ recipient: '', type: 'general', message: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Parent Messages</h2>
          <p className="text-gray-600">{user?.gradeLevel} - Section {user?.section}</p>
        </div>
        <button
          onClick={() => setShowComposeModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Send className="h-4 w-4" />
          <span>New Message</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-blue-600">{mockMessages.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Read Messages</p>
              <p className="text-2xl font-bold text-green-600">
                {mockMessages.filter(m => m.status === 'read').length}
              </p>
            </div>
            <div className="text-green-500">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-2xl font-bold text-purple-600">87%</p>
            </div>
            <div className="text-purple-500">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-orange-600">12</p>
            </div>
            <Send className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search students or parents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Types</option>
              <option value="attendance">Attendance</option>
              <option value="behavior">Behavior</option>
              <option value="academic">Academic</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Messages ({filteredMessages.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredMessages.map((message) => (
            <div key={message.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{message.studentName}</h4>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{message.parentName}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(message.type)}`}>
                      {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{message.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{message.timestamp}</span>
                    <span>•</span>
                    <span className={getStatusColor(message.status)}>
                      {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button className="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50">
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMessages.length === 0 && (
          <div className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No messages found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">New Message</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
                <select
                  value={newMessage.recipient}
                  onChange={(e) => setNewMessage({...newMessage, recipient: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a parent...</option>
                  <option value="robert.johnson">Robert Johnson (Emma's parent)</option>
                  <option value="lisa.chen">Lisa Chen (Michael's parent)</option>
                  <option value="mark.davis">Mark Davis (Sarah's parent)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                <select
                  value={newMessage.type}
                  onChange={(e) => setNewMessage({...newMessage, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="attendance">Attendance</option>
                  <option value="behavior">Behavior</option>
                  <option value="academic">Academic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  rows={4}
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                  placeholder="Type your message here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowComposeModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
