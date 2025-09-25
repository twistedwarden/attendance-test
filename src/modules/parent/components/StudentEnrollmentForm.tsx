import React, { useState } from 'react';
import { UserPlus, Upload, ArrowLeft, CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

interface StudentEnrollmentData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  placeOfBirth: string;
  nationality: string;
  address: string;
  gradeLevel: string;
  documents: File[];
  additionalInfo: string;
}

interface DocumentRequirement {
  id: string;
  name: string;
  required: boolean;
  description: string;
}

export default function StudentEnrollmentForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [enrolledStudent, setEnrolledStudent] = useState<any>(null);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('');

  const [enrollmentData, setEnrollmentData] = useState<StudentEnrollmentData>({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    placeOfBirth: '',
    nationality: 'Filipino',
    address: '',
    gradeLevel: '',
    documents: [],
    additionalInfo: ''
  });

  // Document requirements for Philippine schools
  const documentRequirements: DocumentRequirement[] = [
    {
      id: 'birth_certificate',
      name: 'Birth Certificate (PSA)',
      required: true,
      description: 'Official birth certificate from Philippine Statistics Authority'
    },
    {
      id: 'report_card',
      name: 'Report Card (Previous School Year)',
      required: true,
      description: 'Latest report card or transcript of records'
    },
    {
      id: 'proof_of_downpayment',
      name: 'Proof of Down Payment',
      required: true,
      description: 'Receipt or proof of initial payment'
    },
    {
      id: 'medical_certificate',
      name: 'Medical Certificate',
      required: true,
      description: 'Health certificate from licensed physician'
    },
    {
      id: 'good_moral_certificate',
      name: 'Certificate of Good Moral Character',
      required: true,
      description: 'From previous school or barangay'
    },
    {
      id: 'parents_id',
      name: 'Parent/Guardian Valid ID',
      required: true,
      description: 'Government-issued ID of enrolling parent'
    },
    {
      id: 'passport_photos',
      name: 'Passport Size Photos',
      required: true,
      description: '2x2 colored photos (2 copies)'
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const MAX_FILES = 10;
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    const incoming = Array.from(e.target.files);
    const filtered = incoming.filter(f => f.size <= MAX_SIZE_BYTES);

    if (filtered.length < incoming.length) {
      setError('Some files were skipped because they exceed 10 MB.');
    }

    setEnrollmentData(prev => {
      const combined = [...prev.documents, ...filtered].slice(0, MAX_FILES);
      if ([...prev.documents, ...filtered].length > MAX_FILES) {
        setError('Only the first 10 files were added (limit reached).');
      }
      return {
        ...prev,
        documents: combined
      };
    });
  };

  const handleRemoveFile = (index: number) => {
    setEnrollmentData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!enrollmentData.firstName || !enrollmentData.lastName) {
      setError('First name and last name are required');
      return;
    }

    if (!enrollmentData.dateOfBirth) {
      setError('Date of birth is required');
      return;
    }

    if (!enrollmentData.gender) {
      setError('Gender is required');
      return;
    }

    if (!enrollmentData.gradeLevel) {
      setError('Grade level is required');
      return;
    }

    setIsLoading(true);

    try {
      // 1) If there are files selected, upload them first to get server-side filenames
      const token = localStorage.getItem('auth_token');
      let uploadedFilenames: string[] = [];

      if (enrollmentData.documents.length > 0) {
        const formData = new FormData();
        enrollmentData.documents.forEach((file) => {
          formData.append('documents', file, file.name);
        });

        const uploadRes = await fetch('/api/registrar/upload-documents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData?.success) {
          setError(uploadData?.message || 'Failed to upload documents');
          setIsLoading(false);
          return;
        }

        uploadedFilenames = Array.isArray(uploadData.files)
          ? uploadData.files.map((f: any) => f.filename).filter(Boolean)
          : [];
      }

      // 2) Submit enrollment with the saved filenames so registrar can serve them later
      const response = await fetch('/api/auth/enroll-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentName: `${enrollmentData.firstName} ${enrollmentData.middleName} ${enrollmentData.lastName}`.trim(),
          dateOfBirth: enrollmentData.dateOfBirth,
          gender: enrollmentData.gender,
          placeOfBirth: enrollmentData.placeOfBirth,
          nationality: enrollmentData.nationality,
          address: enrollmentData.address,
          gradeLevel: enrollmentData.gradeLevel,
          // Store just the filenames saved on the server; the registrar viewer
          // uses these to construct /api/registrar/documents/:filename URLs.
          documents: uploadedFilenames,
          additionalInfo: enrollmentData.additionalInfo
        })
      });

      const data = await response.json();

      if (data.success) {
        setEnrolledStudent(data.data);
        setSuccess(true);
        // Call the success callback after a short delay to show the success message
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(data.message || 'Student enrollment failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Student Enrolled Successfully!
            </h2>
            
            <p className="text-gray-600 mb-6">
              {enrolledStudent?.studentName || `${enrollmentData.firstName} ${enrollmentData.middleName} ${enrollmentData.lastName}`.trim()} has been enrolled and is now linked to your account.
            </p>
            
            <button
              onClick={onBack}
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="max-w-4xl w-full mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Enroll New Student</h2>
            <p className="text-gray-600 mt-2">Add a student to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Student Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={enrollmentData.firstName}
                      onChange={(e) => setEnrollmentData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-2">
                      Middle Name
                    </label>
                    <input
                      id="middleName"
                      type="text"
                      value={enrollmentData.middleName}
                      onChange={(e) => setEnrollmentData(prev => ({ ...prev, middleName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter middle name"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={enrollmentData.lastName}
                      onChange={(e) => setEnrollmentData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={enrollmentData.dateOfBirth}
                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    value={enrollmentData.gender}
                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                    Place of Birth
                  </label>
                  <input
                    id="placeOfBirth"
                    type="text"
                    value={enrollmentData.placeOfBirth}
                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, placeOfBirth: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, Province"
                  />
                </div>

                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality
                  </label>
                  <input
                    id="nationality"
                    type="text"
                    value={enrollmentData.nationality}
                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, nationality: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Filipino"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  id="address"
                  value={enrollmentData.address}
                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Complete address including street, barangay, city, province"
                  rows={3}
                />
              </div>

              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level *
                </label>
                <select
                  id="gradeLevel"
                  value={enrollmentData.gradeLevel}
                  onChange={(e) => {
                    setEnrollmentData(prev => ({ ...prev, gradeLevel: e.target.value }));
                    setSelectedGradeLevel(e.target.value);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Grade Level</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                </select>
              </div>
            </div>

            {/* Document Requirements */}
            <div>
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Required Documents</h3>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 mb-3">
                  Please prepare the following documents for enrollment. You can upload them now or bring them to the school office.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documentRequirements.map((doc) => (
                    <div key={doc.id} className="flex items-start space-x-2">
                      <div className={`w-2 h-2 rounded-full mt-2 ${doc.required ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${doc.required ? 'text-gray-900' : 'text-gray-600'}`}>
                          {doc.name}
                          {doc.required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        <p className="text-xs text-gray-500">{doc.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Documents
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <div className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                      <Upload className="h-6 w-6 text-gray-400 mr-3" />
                      <span className="text-gray-600">Choose Files to Upload</span>
                    </div>
                  </label>
                  <div className="text-sm text-gray-500">
                    {enrollmentData.documents.length > 0 
                      ? `${enrollmentData.documents.length} file(s) selected`
                      : 'No files selected'
                    }
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  You can select multiple files. Up to 10 files, 10 MB each. Allowed types: PDF, DOC, DOCX, JPG, PNG.
                </p>
                
                {enrollmentData.documents.length > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected files:</p>
                    <ul className="space-y-1">
                      {enrollmentData.documents.map((file, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center justify-between">
                          <span className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-400" />
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button
                            type="button"
                            className="text-xs text-red-600 hover:underline"
                            onClick={() => handleRemoveFile(index)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Information
              </label>
              <textarea
                id="additionalInfo"
                value={enrollmentData.additionalInfo}
                onChange={(e) => setEnrollmentData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional information about the student, special needs, medical conditions, etc..."
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Enrolling...' : 'Enroll Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
