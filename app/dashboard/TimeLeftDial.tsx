"use client"

import { useState, useEffect } from "react"

interface TimeLeftDialProps {
  startTime: string
  endTime: string
  size?: number
}

export function TimeLeftDial({ startTime, endTime, size = 120 }: TimeLeftDialProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    percentage: number
    isActive: boolean
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    percentage: 0,
    isActive: false,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const start = new Date(startTime).getTime()
      const end = new Date(endTime).getTime()

      if (now < start) {
        // Pool hasn't started yet
        const timeToStart = start - now
        const days = Math.floor(timeToStart / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeToStart % (1000 * 60)) / 1000)

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          percentage: 0,
          isActive: false,
        })
      } else if (now >= start && now <= end) {
        // Pool is active
        const totalDuration = end - start
        const elapsed = now - start
        const remaining = end - now

        const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

        const percentage = Math.max(0, Math.min(100, ((totalDuration - remaining) / totalDuration) * 100))

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          percentage,
          isActive: true,
        })
      } else {
        // Pool has ended
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          percentage: 100,
          isActive: false,
        })
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [startTime, endTime])

  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (timeLeft.percentage / 100) * circumference

  const getStatusColor = () => {
    if (!timeLeft.isActive) {
      return timeLeft.percentage === 100 ? "text-red-500" : "text-gray-500"
    }
    if (timeLeft.percentage > 75) return "text-red-500"
    if (timeLeft.percentage > 50) return "text-yellow-500"
    return "text-green-500"
  }

  const getStrokeColor = () => {
    if (!timeLeft.isActive) {
      return timeLeft.percentage === 100 ? "#ef4444" : "#6b7280"
    }
    if (timeLeft.percentage > 75) return "#ef4444"
    if (timeLeft.percentage > 50) return "#eab308"
    return "#22c55e"
  }

  const getStatusText = () => {
    if (!timeLeft.isActive && timeLeft.percentage === 0) return "Not Started"
    if (!timeLeft.isActive && timeLeft.percentage === 100) return "Ended"
    return "Active"
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth="8" fill="transparent" />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className={`text-2xl font-bold ${getStatusColor()}`}>
            {timeLeft.days > 0
              ? `${timeLeft.days}d`
              : timeLeft.hours > 0
                ? `${timeLeft.hours}h`
                : timeLeft.minutes > 0
                  ? `${timeLeft.minutes}m`
                  : `${timeLeft.seconds}s`}
          </div>
          <div className="text-xs text-gray-500 font-medium">{getStatusText()}</div>
        </div>
      </div>

      {/* Detailed time breakdown */}
      <div className="text-center">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="font-bold text-gray-900">{timeLeft.days}</div>
            <div className="text-gray-500">Days</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">{timeLeft.hours}</div>
            <div className="text-gray-500">Hours</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">{timeLeft.minutes}</div>
            <div className="text-gray-500">Min</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">{timeLeft.seconds}</div>
            <div className="text-gray-500">Sec</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">{Math.round(timeLeft.percentage)}% Complete</div>
      </div>
    </div>
  )
}
