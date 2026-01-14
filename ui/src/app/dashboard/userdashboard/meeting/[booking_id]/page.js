"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import JitsiMeet from "@/components/meeting/JitsiMeet";
import { API_URL } from "@/services/apiendpoints";
import axios from "axios";
import Loader from "@/components/ui/loader/loader";
import Header from "@/components/Header/header";
import { ArrowLeftIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

export default function UserMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.booking_id;
  
  const [meetingData, setMeetingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId) {
      setError("Booking ID is missing");
      setLoading(false);
      return;
    }

    fetchMeetingDetails();
  }, [bookingId]);

  const fetchMeetingDetails = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");

      if (!userId) {
        setError("Please log in to join the meeting");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_URL}user/sessions/meeting/${bookingId}?user_id=${userId}`
      );

      if (response.data.success) {
        setMeetingData(response.data);
      } else {
        setError(response.data.message || "Failed to load meeting details");
      }
    } catch (err) {
      console.error("Error fetching meeting details:", err);
      if (err.response?.status === 403) {
        setError("You don't have permission to access this meeting");
      } else if (err.response?.status === 404) {
        setError("Meeting not found");
      } else if (err.response?.data?.status === 'upcoming') {
        setError(err.response.data.message || "Session has not started yet");
      } else if (err.response?.data?.status === 'ended') {
        setError(err.response.data.message || "This session has ended");
      } else {
        setError("Failed to load meeting. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    router.push("/dashboard/userdashboard/userschedule");
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fcfdfe]">
        <Header />
        <Loader isLoading={true} message="Loading meeting room..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fcfdfe]">
        <Header />
        <main className="flex-grow w-full py-12 px-4 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-all mb-6"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Back</span>
            </button>
            
            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 flex flex-col items-center text-center">
              <ExclamationCircleIcon className="w-12 h-12 text-rose-500 mb-4" />
              <p className="text-rose-900 font-bold mb-2 text-lg">Unable to Join Meeting</p>
              <p className="text-rose-600 text-sm mb-6">{error}</p>
              <button
                onClick={handleLeave}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                Go to Schedule
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!meetingData) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfe]">
      <Header />
      <main className="flex-grow w-full">
        {/* Meeting Header */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLeave}
                className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-all"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">Leave Meeting</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Live Session</h1>
                <p className="text-xs text-gray-500">Booking ID: {bookingId}</p>
              </div>
            </div>
            {meetingData.sessionEndTime && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Session ends at</p>
                <p className="text-sm font-semibold text-gray-700">
                  {new Date(meetingData.sessionEndTime).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info message - only show for users (not mentors) - Above Jitsi container */}
        {meetingData.userInfo?.role === 'user' && (
          <div className="w-full px-4 md:px-8 py-2">
            <div className="max-w-7xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-semibold">💡 Tip:</p>
              <p>If you see "waiting for moderator", your coach needs to join first. Once they join, you can join immediately!</p>
            </div>
          </div>
        )}

        {/* Jitsi Meeting Container */}
        <div className="w-full h-[calc(100vh-140px)] p-2 md:p-4">
          <div className="max-w-7xl mx-auto h-full bg-white rounded-2xl shadow-lg overflow-auto relative">
            <JitsiMeet
              roomName={meetingData.roomName}
              jitsiUrl={meetingData.jitsiUrl}
              userInfo={meetingData.userInfo}
              userRole={meetingData.userInfo?.role || 'user'}
              onLeave={handleLeave}
              className="w-full h-full"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
