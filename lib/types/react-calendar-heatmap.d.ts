declare module 'react-calendar-heatmap' {
  import * as React from 'react'

  export interface CalendarHeatmapProps<T = any> {
    values: T[]
    startDate?: string | number | Date
    endDate?: string | number | Date
    numDays?: number
    maxEmptyDays?: number
    gutterSize?: number
    horizontal?: boolean
    showMonthLabels?: boolean
    showWeekdayLabels?: boolean
    showOutOfRangeDays?: boolean
    tooltipDataAttrs?: ((value: T) => Record<string, string | number | boolean>) | Record<string, string | number | boolean>
    titleForValue?: (value?: T) => string
    classForValue?: (value?: T) => string
    onClick?: (value?: T) => void
    onMouseOver?: (e: React.MouseEvent<SVGRectElement, MouseEvent>, value?: T) => void
    onMouseLeave?: (e: React.MouseEvent<SVGRectElement, MouseEvent>, value?: T) => void
    transformDayElement?: (element: React.ReactElement, value?: T, index?: number) => React.ReactElement
    monthLabels?: string[]
    weekdayLabels?: string[]
  }

  export default class CalendarHeatmap<T = any> extends React.Component<CalendarHeatmapProps<T>> {}
}
