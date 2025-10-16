'use client'

import { useState } from 'react'
import { 
  ChevronLeft, 
  Calendar, 
  Users, 
  TrendingUp,
  Home,
  FileText,
  Building2,
  CheckCircle,
  X,
  CreditCard
} from 'lucide-react'

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState('appointments')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
          <h1 className="text-xl font-semibold text-gray-900">Appointments Completed - Today</h1>
          <button className="px-4 py-1 bg-green-500 text-white text-sm rounded-full font-medium">
            Sarga
          </button>
        </div>
      </div>

      {/* Hospital Cards - Not full width, with proper spacing */}
      <div className="px-4 pt-4 space-y-3">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">Princess Grace</h3>
              <p className="text-purple-100 text-sm mt-1">Tuesday 5-8 PM</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">London Clinic</h3>
              <p className="text-gray-700 text-sm mt-1">Wednesday 2-6 PM</p>
            </div>
            <div className="bg-cyan-100 p-2 rounded-lg">
              <Building2 className="w-5 h-5 text-cyan-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Stats Card */}
      <div className="px-4 mt-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="w-5 h-5 mr-2" />
            <span className="font-medium">Appointment Schedule</span>
          </div>
          
          <div className="text-5xl font-bold text-center my-4">6</div>
          <p className="text-center text-blue-100 mb-6">Spine Surgery Schedule</p>
          
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold">6</div>
              <div className="text-xs text-blue-100 mt-1">Slots Filled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">3</div>
              <div className="text-xs text-blue-100 mt-1">Slots Unfilled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">£900</div>
              <div className="text-xs text-blue-100 mt-1">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs text-blue-100 mt-1">No Shows</div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Section */}
      <div className="px-4 mt-6 pb-24">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Princess Grace Hospital Appointments</h2>
        <p className="text-gray-600 text-sm mb-4">Tuesday • 5:00 PM - 8:00 PM</p>

        {/* Patient 1 - Mrs. Sarah Henderson */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">Mrs. Sarah Henderson</h3>
              <p className="text-gray-600 text-sm mt-1">Age 52 • BUPA</p>
            </div>
            <div className="text-right">
              <span className="text-blue-600 font-semibold">5:00 PM</span>
              <div className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full mt-1 inline-block font-medium">
                Princess Grace
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm text-gray-800">Lumbar Disc Consultation</span>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-green-600 font-semibold text-lg">£420</span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs font-medium text-gray-600 mb-1">Clinical Notes:</p>
            <p className="text-sm text-gray-800">L4-L5 disc herniation, 6 months lower back pain radiating to left leg</p>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => window.location.href = '/voice-notes/p-1'}
              className="bg-blue-500 text-white py-2.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-blue-600 transition-colors">
              <CheckCircle className="w-4 h-4" />
              Done + MRI
            </button>
            <button className="bg-green-500 text-white py-2.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-green-600 transition-colors">
              <FileText className="w-4 h-4" />
              Surgery Plan
            </button>
            <button className="bg-orange-500 text-white py-2.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-orange-600 transition-colors">
              <Calendar className="w-4 h-4" />
              Follow-up
            </button>
            <button className="bg-red-500 text-white py-2.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-red-600 transition-colors">
              <X className="w-4 h-4" />
              No Show
            </button>
          </div>
        </div>

        {/* Patient 2 - Mr. James Mitchell */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">Mr. James Mitchell</h3>
              <p className="text-gray-600 text-sm mt-1">Age 67 • Private Pay</p>
            </div>
            <div className="text-right">
              <span className="text-blue-600 font-semibold">5:30 PM</span>
              <div className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full mt-1 inline-block font-medium">
                Princess Grace
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm text-gray-800">Post-Op Spinal Fusion Review</span>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-green-600 font-semibold text-lg">£380</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 py-2">
          <button className="flex flex-col items-center gap-1 py-2">
            <Home className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-500">Dashboard</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 py-2"
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Appointments</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-500">Reminders</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-500">ROI</span>
          </button>
        </div>
      </div>
    </div>
  )
}