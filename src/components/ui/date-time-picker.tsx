import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
  disabled?: boolean;
}

export function DateTimePicker({ value, onChange, minDate, disabled }: DateTimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }

    const currentHour = value?.getHours() ?? 9;
    const currentMinute = value?.getMinutes() ?? 0;
    
    date.setHours(currentHour, currentMinute, 0, 0);
    onChange(date);
  };

  const handleTimeChange = (type: 'hour' | 'minute', timeValue: string) => {
    if (!value) {
      const newDate = new Date();
      newDate.setMinutes(0, 0, 0);
      if (type === 'hour') {
        newDate.setHours(parseInt(timeValue));
      }
      onChange(newDate);
      return;
    }

    const newDate = new Date(value);
    if (type === 'hour') {
      newDate.setHours(parseInt(timeValue));
    } else {
      newDate.setMinutes(parseInt(timeValue));
    }
    onChange(newDate);
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "d MMMM yyyy", { locale: sv }) : "Välj datum"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              return false;
            }}
            initialFocus
            locale={sv}
          />
        </PopoverContent>
      </Popover>

      <Select
        value={value ? value.getHours().toString().padStart(2, '0') : undefined}
        onValueChange={(val) => handleTimeChange('hour', val)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Timme" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((hour) => (
            <SelectItem key={hour} value={hour}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value ? value.getMinutes().toString().padStart(2, '0') : undefined}
        onValueChange={(val) => handleTimeChange('minute', val)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Minut" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((minute) => (
            <SelectItem key={minute} value={minute}>
              {minute}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
