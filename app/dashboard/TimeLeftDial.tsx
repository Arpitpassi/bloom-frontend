import React from "react"
import { format, differenceInMilliseconds, isBefore } from "date-fns"

interface TimeLeftDialProps {
  startTime: string
  endTime: string
}

export const TimeLeftDial: React.FC<TimeLeftDialProps> = ({ startTime, endTime }) => {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)
  const isEnded = isBefore(end, now)
  const totalDuration = differenceInMilliseconds(end, start)
  const elapsed = differenceInMilliseconds(now, start)
  const progress = isEnded ? 100 : Math.min((elapsed / totalDuration) * 100, 100)
  const msLeft = differenceInMilliseconds(end, now)
  const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24))
  const hoursLeft = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const timeLeft = isEnded ? "Ended" : daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h left` : `${hoursLeft}h left`

  return (
    <div className="flex flex-col items-center">
      <svg className="w-16 h-16" viewBox="0 0 36 36">
        <path
          className="stroke-gray-200"
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          strokeWidth="2"
        />
        <path
          className={`stroke-${isEnded ? 'red-500' : 'green-500'}`}
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          strokeWidth="2"
          strokeDasharray={`${progress}, 100`}
        />
        <text
          x="18"
          y="20"
          textAnchor="middle"
          className="text-xs font-medium text-gray-900"
        >
          {timeLeft}
        </text>
      </svg>
    </div>
  )
}