import { useState, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import 'react-day-picker/dist/style.css';

interface DateFilterProps {
  onDateRangeChange: (range: { from: Date; to: Date } | null) => void;
}

const DateFilter = ({ onDateRangeChange }: DateFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [numberOfMonths, setNumberOfMonths] = useState(2);

  // Handle responsive number of months
  useEffect(() => {
    const handleResize = () => {
      setNumberOfMonths(window.innerWidth < 768 ? 1 : 2);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRangeSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to });
      setIsOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!selectedRange?.from) return 'Select date range';
    if (!selectedRange?.to) return format(selectedRange.from, 'MMM dd, yyyy');
    return `${format(selectedRange.from, 'MMM dd')} - ${format(selectedRange.to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 w-full sm:w-auto"
      >
        <Calendar size={16} />
        <span className="truncate">{formatDateRange()}</span>
        <ChevronDown size={16} />
      </Button>
      
      {isOpen && (
        <>
          {/* Backdrop for all screen sizes */}
          <div 
            className="fixed inset-0 bg-black/10 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <Card className="absolute right-0 mt-2 z-50 shadow-xl bg-white border-2 w-[calc(100vw-2rem)] sm:w-auto min-w-[320px]">
            <CardContent className="p-4 overflow-auto bg-white">
              <DayPicker
                mode="range"
                selected={selectedRange}
                onSelect={handleRangeSelect}
                numberOfMonths={numberOfMonths}
                className="rdp-custom mx-auto"
                showOutsideDays={true}
                styles={{
                  root: { maxWidth: '100%' }
                }}
              />
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRange(undefined);
                    onDateRangeChange(null);
                    setIsOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DateFilter; 