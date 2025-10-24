import { useState } from 'react';
import { User, Mail, Phone, Edit, Save, X, Users, ContactInfo } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Parent, Student, ParentService } from '../api/parentService';
import ChangePasswordCard from '../components/ChangePasswordCard';

interface CompactProfileProps {
  parentData: Parent | null;
  students: Student[];
}

const CompactProfile = ({ parentData, students }: CompactProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Parent | null>(parentData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(parentData);
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!editedData) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Prepare the update data
      const updateData: Partial<Parent> = {};
      
      if (editedData.fullName !== parentData?.fullName) {
        updateData.fullName = editedData.fullName;
      }
      if (editedData.email !== parentData?.email) {
        updateData.email = editedData.email;
      }
      if (editedData.phoneNumber !== parentData?.phoneNumber) {
        updateData.phoneNumber = editedData.phoneNumber;
      }
      if (editedData.relationship !== parentData?.relationship) {
        updateData.relationship = editedData.relationship;
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length > 0) {
        await ParentService.updateParentProfile(updateData);
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Update the parent data with the new values
        if (parentData) {
          Object.assign(parentData, updateData);
        }
      } else {
        setSaveMessage({ type: 'success', text: 'No changes to save.' });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save profile. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(parentData);
    setIsEditing(false);
    setSaveMessage(null);
  };

  // Function to get appropriate section title based on relationship and count
  const getStudentsSectionTitle = () => {
    if (!parentData?.relationship) return students.length === 1 ? 'My Student' : 'My Students';
    
    const relationship = parentData.relationship.toLowerCase();
    const isSingular = students.length === 1;
    
    if (relationship.includes('mother') || relationship.includes('father') || relationship.includes('parent')) {
      return isSingular ? 'My Child' : 'My Children';
    } else if (relationship.includes('guardian')) {
      return isSingular ? 'My Ward' : 'My Wards';
    } else if (relationship.includes('aunt') || relationship.includes('uncle')) {
      return isSingular ? 'My Niece/Nephew' : 'My Nieces/Nephews';
    } else if (relationship.includes('grandmother') || relationship.includes('grandfather') || relationship.includes('grandparent')) {
      return isSingular ? 'My Grandchild' : 'My Grandchildren';
    } else {
      // Default fallback for other relationships
      return isSingular ? 'My Student' : 'My Students';
    }
  };

  if (!parentData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof Parent, value: string) => {
    setEditedData(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);
  };

  return (
    <div className="space-y-6">
      {/* Compact Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
          <p className="text-gray-600 text-sm">Manage your account information</p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit} size="sm" className="flex items-center space-x-2">
            <Edit size={14} />
            <span>Edit</span>
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button 
              onClick={handleSave} 
              size="sm" 
              className="flex items-center space-x-2"
              disabled={isSaving}
            >
              <Save size={14} />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel} 
              size="sm" 
              className="flex items-center space-x-2"
              disabled={isSaving}
            >
              <X size={14} />
              <span>Cancel</span>
            </Button>
          </div>
        )}
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-3 rounded-lg ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="text-sm font-medium">{saveMessage.text}</p>
        </div>
      )}

      {/* Compact Parent Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <User size={18} />
            <span>{parentData?.relationship || 'Parent'} Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Profile Picture and Name */}
            <div className="lg:col-span-2 flex items-center space-x-3 mb-2">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={24} className="text-blue-600" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={editedData.fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('fullName', e.target.value)}
                    className="text-lg font-semibold"
                  />
                ) : (
                  <h3 className="text-lg font-semibold text-gray-800">{parentData.fullName}</h3>
                )}
                <p className="text-gray-600 text-sm">Parent/Guardian</p>
              </div>
            </div>

            {/* Contact Information - Single Icon */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <ContactInfo size={14} className="text-gray-500 mt-1" />
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-gray-700 block">Contact Information</label>
                  {isEditing ? (
                    <div className="space-y-2 mt-1">
                      <Input
                        type="email"
                        value={editedData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                        className="text-sm"
                        placeholder="Email"
                      />
                      <Input
                        type="tel"
                        value={editedData.phoneNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phoneNumber', e.target.value)}
                        className="text-sm"
                        placeholder="Phone Number"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowContactModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      View Contact Details
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <User size={14} className="text-gray-500 mt-1" />
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-gray-700 block">Relationship</label>
                  {isEditing ? (
                    <select
                      value={editedData.relationship || 'Guardian'}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('relationship', e.target.value)}
                      className="mt-1 text-sm w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-800">{parentData.relationship}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Students Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Users size={18} />
            <span>{getStudentsSectionTitle()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Enrollment Status Summary */}
          {students.some(s => s.enrollmentStatus === 'pending') && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">⏳</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {students.filter(s => s.enrollmentStatus === 'pending').length} Pending Enrollment{students.filter(s => s.enrollmentStatus === 'pending').length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-yellow-600">
                    Awaiting admin approval
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {students.some(s => s.enrollmentStatus === 'declined') && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">❌</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {students.filter(s => s.enrollmentStatus === 'declined').length} Declined Enrollment{students.filter(s => s.enrollmentStatus === 'declined').length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-red-600">
                    This entry will be removed soon
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {students.map((student) => (
              <div key={student.studentId} className={`p-3 border rounded-lg hover:shadow-sm transition-shadow ${
                student.enrollmentStatus === 'pending' ? 'border-yellow-300 bg-yellow-50' : 
                student.enrollmentStatus === 'declined' ? 'border-red-300 bg-red-50' : ''
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    student.enrollmentStatus === 'pending' ? 'bg-yellow-100' :
                    student.enrollmentStatus === 'declined' ? 'bg-red-100' :
                    'bg-pink-100'
                  }`}>
                    <User size={16} className={`${
                      student.enrollmentStatus === 'pending' ? 'text-yellow-600' :
                      student.enrollmentStatus === 'declined' ? 'text-red-600' :
                      'text-pink-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 text-sm truncate">{student.fullName}</h4>
                    <p className="text-xs text-gray-600">Grade {student.gradeLevel} • Section {student.section}</p>
                    <p className="text-xs text-gray-500">ID: {student.studentId}</p>
                    {student.enrollmentStatus === 'pending' && (
                      <p className="text-xs text-yellow-600 font-medium">⏳ Pending Enrollment</p>
                    )}
                    {student.enrollmentStatus === 'declined' && (
                      <p className="text-xs text-red-600 font-medium">❌ Enrollment Declined</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <ChangePasswordCard />

      {/* Contact Information Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-900">{parentData?.email || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-sm text-gray-900">{parentData?.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactProfile; 