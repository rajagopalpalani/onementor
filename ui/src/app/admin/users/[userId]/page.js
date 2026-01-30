"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User, Mail, Phone, CheckCircle, XCircle } from "lucide-react";
import { adminAuth } from "@/utils/adminAuth";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId;

  const [user, setUser] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if admin is authenticated
    if (!adminAuth.isAuthenticated()) {
      router.push('/admin');
      return;
    }

    fetchUserData();
  }, [userId, router]);

  const fetchUserData = async () => {
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      // Fetch user details
      const userResponse = await fetch(`${apiUrl}/api/users/${userId}`, {
        credentials: 'include',
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.data || userData);
      } else {
        setError("Failed to fetch user details");
      }

      // Fetch user sessions
      const sessionsResponse = await fetch(`${apiUrl}/api/admin/users/${userId}/sessions`, {
        credentials: 'include',
      });

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        
        if (sessionsData.success) {
          setUpcomingSessions(sessionsData.data.upcoming || []);
          setSessionHistory(sessionsData.data.history || []);
        }
      }

    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-semibold text-slate-800">User Details</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* User Info Card */}
      {user && (
        <div className="bg-white rounded-2xl shadow-md border p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <User size={32} className="text-blue-600" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
              <p className="text-sm text-slate-500 mt-1 capitalize">
                {user.role === 'mentor' ? '👨‍🏫 Mentor' : '👨‍🎓 Mentee'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail size={18} />
                  <span>{user.email}</span>
                </div>
                
                {user.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={18} />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  {Number(user.is_active) === 1 ? (
                    <>
                      <CheckCircle size={18} className="text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={18} className="text-red-600" />
                      <span className="text-sm text-red-600 font-medium">Inactive</span>
                    </>
                  )}
                </div>

                {Number(user.is_verified) === 1 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Section */}
      <div className="bg-white rounded-2xl shadow-md border">
        {/* Tabs */}
        <div className="flex gap-3 p-4 border-b bg-slate-50 rounded-t-2xl">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "upcoming"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            Upcoming Sessions ({upcomingSessions.length})
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "history"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            Session History ({sessionHistory.length})
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-6">
          {activeTab === "upcoming" ? (
            upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="border rounded-lg p-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">
                          {user?.role === 'mentor' 
                            ? `Session with ${session.user_name || 'Mentee'}`
                            : `Session with ${session.mentor_name || 'Mentor'}`
                          }
                        </h3>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>{formatDate(session.date || session.slot_date)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock size={16} />
                            <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                          </div>
                        </div>

                        {session.topic && (
                          <p className="text-sm text-slate-500 mt-2">
                            Topic: {session.topic}
                          </p>
                        )}
                      </div>

                      <div>
                        {getStatusBadge(session.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
                <p>No upcoming sessions</p>
              </div>
            )
          ) : (
            sessionHistory.length > 0 ? (
              <div className="space-y-4">
                {sessionHistory.map((session) => (
                  <div
                    key={session.id}
                    className="border rounded-lg p-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">
                          {user?.role === 'mentor' 
                            ? `Session with ${session.user_name || 'Mentee'}`
                            : `Session with ${session.mentor_name || 'Mentor'}`
                          }
                        </h3>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>{formatDate(session.date || session.slot_date)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock size={16} />
                            <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                          </div>
                        </div>

                        {session.topic && (
                          <p className="text-sm text-slate-500 mt-2">
                            Topic: {session.topic}
                          </p>
                        )}

                        {session.feedback && (
                          <p className="text-sm text-slate-600 mt-2 italic">
                            Feedback: {session.feedback}
                          </p>
                        )}
                      </div>

                      <div>
                        {getStatusBadge(session.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
                <p>No session history</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
