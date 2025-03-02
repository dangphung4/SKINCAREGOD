'use client';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getDay, getDaysInMonth, isSameDay } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { type ReactNode, createContext, useContext, useState, useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type CalendarState = {
  month: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  year: number;
  setMonth: (month: CalendarState['month']) => void;
  setYear: (year: CalendarState['year']) => void;
};

export const useCalendar = create<CalendarState>()(
  devtools((set) => ({
    month: new Date().getMonth() as CalendarState['month'],
    year: new Date().getFullYear(),
    setMonth: (month: CalendarState['month']) => set(() => ({ month })),
    setYear: (year: CalendarState['year']) => set(() => ({ year })),
  }))
);

export type CalendarContextProps = {
  locale: Intl.LocalesArgument;
  startDay: number;
  onSelectDate?: (date: Date, event?: React.MouseEvent) => void;
  selectedDate?: Date;
  onMonthChange?: (month: number, year: number) => void;
  month?: number;
  year?: number;
  day?: number;
  weekday?: number;
  selected?: Date;
  today?: Date;
  setMonth?: (month: number) => void;
  setYear?: (year: number) => void;
  setDay?: (day: number) => void;
  setSelected?: (day: Date, event?: React.MouseEvent) => void;
};

const CalendarContext = createContext<CalendarContextProps>({
  locale: 'en-US',
  startDay: 0,
});

export type Status = {
  id: string;
  name: string;
  color: string;
};

export type Feature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: Status;
};

type ComboboxProps = {
  value: string;
  setValue: (value: string) => void;
  data: {
    value: string;
    label: string;
  }[];
  labels: {
    button: string;
    empty: string;
    search: string;
  };
  className?: string;
};

export const monthsForLocale = (
  localeName: Intl.LocalesArgument,
  monthFormat: Intl.DateTimeFormatOptions['month'] = 'long'
) => {
  const format = new Intl.DateTimeFormat(localeName, { month: monthFormat }).format;

  // Create an array of month names that match their JavaScript index (0-11)
  return Array.from({ length: 12 }, (_, i) => 
    format(new Date(2021, i))
  );
};

export const daysForLocale = (locale: Intl.LocalesArgument, startDay: number) => {
  const weekdays: string[] = [];
  const baseDate = new Date(2024, 0, startDay);

  for (let i = 0; i < 7; i++) {
    weekdays.push(
      new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(baseDate)
    );
    baseDate.setDate(baseDate.getDate() + 1);
  }

  return weekdays;
};

const Combobox = ({
  value,
  setValue,
  data,
  labels,
  className,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className={cn('w-40 justify-between capitalize', className)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {value
            ? data.find((item) => item.value === value)?.label
            : labels.button}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0">
        <Command
          filter={(value, search) => {
            const label = data.find((item) => item.value === value)?.label;

            return label?.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={labels.search} />
          <CommandList>
            <CommandEmpty>{labels.empty}</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="capitalize"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

type OutOfBoundsDayProps = {
  day: number;
};

const OutOfBoundsDay = ({ day }: OutOfBoundsDayProps) => (
  <div className="relative h-full w-full bg-secondary p-1 text-muted-foreground text-xs">
    {day}
  </div>
);

export type CalendarBodyProps = {
  features: Feature[];
  children: (props: {
    feature: Feature;
  }) => ReactNode;
  selectedDate?: Date;
  onSelectDate?: (date: Date, event?: React.MouseEvent) => void;
};

export const CalendarBody = ({ 
  features, 
  children, 
  selectedDate, 
  onSelectDate 
}: CalendarBodyProps) => {
  const { month, year } = useCalendar();
  const { startDay } = useContext(CalendarContext);
  const daysInMonth = getDaysInMonth(new Date(year, month, 1));
  const firstDay = (getDay(new Date(year, month, 1)) - startDay + 7) % 7;
  const days: ReactNode[] = [];

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonthDays = getDaysInMonth(new Date(prevMonthYear, prevMonth, 1));
  const prevMonthDaysArray = Array.from(
    { length: prevMonthDays },
    (_, i) => i + 1
  );

  // Today's date for highlighting
  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  // Check if a date is selected
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === month && 
           selectedDate.getFullYear() === year;
  };

  for (let i = 0; i < firstDay; i++) {
    const day = prevMonthDaysArray[prevMonthDays - firstDay + i];

    if (day) {
      days.push(<OutOfBoundsDay key={`prev-${i}`} day={day} />);
    }
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const featuresForDay = features.filter((feature) => {
      return isSameDay(new Date(feature.endAt), currentDate);
    });

    days.push(
      <div
        key={day}
        className={cn(
          "relative flex h-full w-full flex-col gap-1 p-2 text-xs cursor-pointer transition-colors",
          isToday(day) ? "bg-primary/10" : "",
          isSelected(day) ? "bg-primary/20 font-medium" : "",
          !isToday(day) && !isSelected(day) ? "hover:bg-muted" : ""
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onSelectDate) {
            onSelectDate(currentDate, e);
          }
          return false;
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          return false;
        }}
      >
        <div className="flex justify-between items-start">
          <span className={cn(
            isToday(day) ? "text-primary font-medium" : "",
            isSelected(day) ? "font-medium" : ""
          )}>
            {day}
          </span>
          {featuresForDay.length > 0 && (
            <div 
              className="h-2 w-2 rounded-full" 
              style={{ backgroundColor: featuresForDay[0].status.color }}
            />
          )}
        </div>
        <div className="mt-1">
          {featuresForDay.slice(0, 1).map((feature) => children({ feature }))}
        </div>
      </div>
    );
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonthDays = getDaysInMonth(new Date(nextMonthYear, nextMonth, 1));
  const nextMonthDaysArray = Array.from(
    { length: nextMonthDays },
    (_, i) => i + 1
  );

  const remainingDays = 7 - ((firstDay + daysInMonth) % 7);
  if (remainingDays < 7) {
    for (let i = 0; i < remainingDays; i++) {
      const day = nextMonthDaysArray[i];

      if (day) {
        days.push(<OutOfBoundsDay key={`next-${i}`} day={day} />);
      }
    }
  }

  return (
    <div className="grid flex-grow grid-cols-7">
      {days.map((day, index) => (
        <div
          key={index}
          className={cn(
            'relative aspect-square overflow-hidden border-t border-r',
            index % 7 === 6 && 'border-r-0'
          )}
        >
          {day}
        </div>
      ))}
    </div>
  );
};

export type CalendarDatePickerProps = {
  className?: string;
  children: ReactNode;
};

export const CalendarDatePicker = ({
  className,
  children,
}: CalendarDatePickerProps) => (
  <div className={cn('flex items-center gap-1', className)}>{children}</div>
);

export type CalendarMonthPickerProps = {
  className?: string;
};

export const CalendarMonthPicker = ({
  className,
}: CalendarMonthPickerProps) => {
  const { month, setMonth, year } = useCalendar();
  const { locale, onMonthChange } = useContext(CalendarContext);

  const handleMonthChange = (value: string) => {
    const newMonth = Number.parseInt(value) as CalendarState['month'];
    setMonth(newMonth);
    
    // Call onMonthChange if provided
    if (onMonthChange) {
      onMonthChange(newMonth, year);
    }
  };

  return (
    <Combobox
      className={className}
      value={month.toString()}
      setValue={handleMonthChange}
      data={monthsForLocale(locale).map((monthName, index) => ({
        value: index.toString(),
        label: monthName,
      }))}
      labels={{
        button: 'Select month',
        empty: 'No month found',
        search: 'Search month',
      }}
    />
  );
};

export type CalendarYearPickerProps = {
  className?: string;
  start: number;
  end: number;
};

export const CalendarYearPicker = ({
  className,
  start,
  end,
}: CalendarYearPickerProps) => {
  const { year, setYear, month } = useCalendar();
  const { onMonthChange } = useContext(CalendarContext);

  const handleYearChange = (value: string) => {
    const newYear = Number.parseInt(value);
    setYear(newYear);
    
    // Call onMonthChange if provided
    if (onMonthChange) {
      onMonthChange(month, newYear);
    }
  };

  return (
    <Combobox
      className={className}
      value={year.toString()}
      setValue={handleYearChange}
      data={Array.from({ length: end - start + 1 }, (_, i) => ({
        value: (start + i).toString(),
        label: (start + i).toString(),
      }))}
      labels={{
        button: 'Select year',
        empty: 'No year found',
        search: 'Search year',
      }}
    />
  );
};

export type CalendarDatePaginationProps = {
  className?: string;
};

export const CalendarDatePagination = ({
  className,
}: CalendarDatePaginationProps) => {
  const { month, year, setMonth, setYear } = useCalendar();
  const { onMonthChange } = useContext(CalendarContext);

  const handlePreviousMonth = () => {
    let newMonth: CalendarState['month'], newYear: number;
    
    if (month === 0) {
      newMonth = 11;
      newYear = year - 1;
      setMonth(newMonth);
      setYear(newYear);
    } else {
      newMonth = (month - 1) as CalendarState['month'];
      newYear = year;
      setMonth(newMonth);
    }
    
    // Call onMonthChange if provided
    if (onMonthChange) {
      onMonthChange(newMonth, newYear);
    }
  };

  const handleNextMonth = () => {
    let newMonth: CalendarState['month'], newYear: number;
    
    if (month === 11) {
      newMonth = 0;
      newYear = year + 1;
      setMonth(newMonth);
      setYear(newYear);
    } else {
      newMonth = (month + 1) as CalendarState['month'];
      newYear = year;
      setMonth(newMonth);
    }
    
    // Call onMonthChange if provided
    if (onMonthChange) {
      onMonthChange(newMonth, newYear);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handlePreviousMonth();
        }} 
        variant="ghost" 
        size="icon"
      >
        <ChevronLeftIcon size={16} />
      </Button>
      <Button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNextMonth();
        }} 
        variant="ghost" 
        size="icon"
      >
        <ChevronRightIcon size={16} />
      </Button>
    </div>
  );
};

export type CalendarDateProps = {
  children: ReactNode;
};

export const CalendarDate = ({ children }: CalendarDateProps) => (
  <div className="flex items-center justify-between p-3">{children}</div>
);

export type CalendarHeaderProps = {
  className?: string;
};

export const CalendarHeader = ({ className }: CalendarHeaderProps) => {
  const { locale, startDay } = useContext(CalendarContext);

  return (
    <div className={cn('grid flex-grow grid-cols-7', className)}>
      {daysForLocale(locale, startDay).map((day) => (
        <div key={day} className="p-3 text-center text-muted-foreground text-xs font-medium">
          {day}
        </div>
      ))}
    </div>
  );
};

export type CalendarItemProps = {
  feature: Feature;
  className?: string;
};

export const CalendarItem = ({ feature, className }: CalendarItemProps) => (
  <div className={cn('flex items-center gap-1', className)} key={feature.id}>
    <span className="truncate text-xs">{feature.name}</span>
  </div>
);

export type CalendarProviderProps = {
  locale?: Intl.LocalesArgument;
  startDay?: number;
  children: ReactNode;
  className?: string;
  onSelectDate?: (date: Date, event?: React.MouseEvent) => void;
  selectedDate?: Date;
  onMonthChange?: (month: number, year: number) => void;
};

export function CalendarProvider({
  children,
  className,
  onSelectDate,
  selectedDate,
  onMonthChange,
  locale = 'en-US',
  startDay = 0,
}: CalendarProviderProps) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [day, setDay] = useState(today.getDate());
  const [weekday] = useState(today.getDay());
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>(
    selectedDate ? [selectedDate] : undefined
  );

  // Handle date selection
  const setSelected = useCallback(
    (day: Date, event?: React.MouseEvent) => {
      // If onSelectDate is provided, call it
      if (onSelectDate) {
        onSelectDate(day, event);
      }
      
      setSelectedDates([day]);
    },
    [onSelectDate]
  );

  const handleSetMonth = useCallback((newMonth: number) => {
    setMonth(newMonth);
    if (onMonthChange) {
      onMonthChange(newMonth, year);
    }
  }, [year, onMonthChange]);

  const handleSetYear = useCallback((newYear: number) => {
    setYear(newYear);
    if (onMonthChange) {
      onMonthChange(month, newYear);
    }
  }, [month, onMonthChange]);

  const contextValue = useMemo(() => {
    return {
      locale,
      startDay,
      month,
      year,
      day,
      weekday,
      selected: selectedDates?.[0],
      selectedDate: selectedDates?.[0],
      today,
      setMonth: handleSetMonth,
      setYear: handleSetYear,
      setDay,
      setSelected,
      onMonthChange,
      onSelectDate,
    };
  }, [
    locale,
    startDay,
    month,
    year,
    day,
    weekday,
    selectedDates,
    today,
    handleSetMonth,
    handleSetYear,
    setDay,
    setSelected,
    onMonthChange,
    onSelectDate,
  ]);

  return (
    <CalendarContext.Provider value={contextValue}>
      <div className={cn('relative flex flex-col', className)}>{children}</div>
    </CalendarContext.Provider>
  );
}
