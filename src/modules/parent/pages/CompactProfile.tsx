import { useState } from 'react';
import { User, Mail, Phone, MapPin, Edit, Save, X, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Parent, Student } from '../data/enhancedMockData';

interface CompactProfileProps {
  parentData: Parent;
  daughters: Student[];
}

const CompactProfile = ({ parentData, daughters }: CompactProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Parent>(parentData);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(parentData);
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving profile data:', editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData(parentData);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof Parent, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
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
            <Button onClick={handleSave} size="sm" className="flex items-center space-x-2">
              <Save size={14} />
              <span>Save</span>
            </Button>
            <Button variant="outline" onClick={handleCancel} size="sm" className="flex items-center space-x-2">
              <X size={14} />
              <span>Cancel</span>
            </Button>
          </div>
        )}
      </div>

      {/* Compact Parent Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <User size={18} />
            <span>Parent Information</span>
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

            {/* Contact Information - Compact Grid */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Mail size={14} className="text-gray-500 mt-1" />
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-gray-700 block">Email</label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                      className="mt-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-800 truncate">{parentData.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Phone size={14} className="text-gray-500 mt-1" />
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-gray-700 block">Phone</label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={editedData.phoneNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phoneNumber', e.target.value)}
                      className="mt-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-800">{parentData.phoneNumber}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin size={14} className="text-gray-500 mt-1" />
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-gray-700 block">Address</label>
                  {isEditing ? (
                    <Input
                      value={editedData.address}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('address', e.target.value)}
                      className="mt-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-800">{parentData.address}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <User size={14} className="text-gray-500 mt-1" />
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-gray-700 block">Relationship</label>
                  {isEditing ? (
                    <Input
                      value={editedData.relationship}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('relationship', e.target.value)}
                      className="mt-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-800">{parentData.relationship}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Daughters Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Users size={18} />
            <span>My Daughters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {daughters.map((daughter) => (
              <div key={daughter.studentId} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-pink-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 text-sm truncate">{daughter.fullName}</h4>
                    <p className="text-xs text-gray-600">Grade {daughter.gradeLevel}{daughter.section}</p>
                    <p className="text-xs text-gray-500">ID: {daughter.studentId}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compact Account Settings Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 text-sm">Notifications</h4>
                <p className="text-xs text-gray-600">Email notifications about activities</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 text-sm">Privacy Settings</h4>
                <p className="text-xs text-gray-600">Data sharing preferences</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 text-sm">Change Password</h4>
                <p className="text-xs text-gray-600">Update account password</p>
              </div>
              <Button variant="outline" size="sm">Change</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompactProfile; 