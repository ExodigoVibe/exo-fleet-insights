import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Info, Car, FileText, Users, Upload, Send } from "lucide-react";
import { useSnowflakeVehicles } from "@/hooks/useSnowflakeVehicles";
import { useCreateEventReport } from "@/hooks/queries/useEventReportsQuery";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formSchema = z.object({
  vehicleId: z.string().min(1, "Please select a vehicle"),
  employeeName: z.string().min(1, "Employee name is required").max(100),
  eventDateTime: z.date({ required_error: "Date and time is required" }),
  location: z.string().min(1, "Location is required").max(200),
  description: z.string().min(10, "Please provide a detailed description").max(1000),
  severity: z.enum(["slight", "extensive"]),
  thirdPartyInvolved: z.boolean().default(false),
  thirdPartyCarOwner: z.string().optional(),
  thirdPartyLicensePlate: z.string().optional(),
  thirdPartyAddress: z.string().optional(),
  thirdPartyPhone: z.string().optional(),
  thirdPartyIdNumber: z.string().optional(),
  thirdPartyInsurance: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ReportEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportEventDialog({ open, onOpenChange }: ReportEventDialogProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { vehicles, loading: isLoadingVehicles } = useSnowflakeVehicles();
  const createEventReport = useCreateEventReport();
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleId: "",
      employeeName: "",
      location: "",
      description: "",
      severity: "slight",
      thirdPartyInvolved: false,
      thirdPartyCarOwner: "",
      thirdPartyLicensePlate: "",
      thirdPartyAddress: "",
      thirdPartyPhone: "",
      thirdPartyIdNumber: "",
      thirdPartyInsurance: "",
    },
  });

  // Auto-fill employee name from SSO when dialog opens
  useEffect(() => {
    if (open && user?.name) {
      form.setValue("employeeName", user.name);
    }
  }, [open, user, form]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      await createEventReport.mutateAsync({
        vehicle_license_plate: data.vehicleId,
        employee_name: data.employeeName,
        event_date: data.eventDateTime.toISOString(),
        location: data.location,
        description: data.description,
        severity: data.severity,
        third_party_involved: data.thirdPartyInvolved,
        third_party_name: data.thirdPartyCarOwner,
        third_party_phone: data.thirdPartyPhone,
        third_party_license_plate: data.thirdPartyLicensePlate,
        third_party_insurance: data.thirdPartyInsurance,
      });
      
      onOpenChange(false);
      form.reset();
      setUploadedFiles([]);
      form.setValue("severity", "slight");
    } catch (error) {
      console.error("Failed to submit event report:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Reporting an Incident
          </DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-6">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Please fill out this form with as much detail as possible. Your accuracy helps us resolve the situation quickly and efficiently.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Vehicle & Basic Info Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Vehicle & Basic Info
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Involved</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a vehicle..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50">
                          {isLoadingVehicles ? (
                            <SelectItem value="loading" disabled>Loading vehicles...</SelectItem>
                          ) : vehicles.length === 0 ? (
                            <SelectItem value="none" disabled>No vehicles available</SelectItem>
                          ) : (
                            vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.license_plate} value={vehicle.license_plate}>
                                {vehicle.license_plate} - {vehicle.nickname || vehicle.model_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employeeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Name</FormLabel>
                      <FormControl>
                        <Input placeholder={!user?.name ? "Enter your name" : ""} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventDateTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date and Time of Event</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal hover:bg-gray-100 hover:text-foreground",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy, HH:mm")
                              ) : (
                                <span>27/11/2025, 14:55</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location of Event</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location (street, city, etc.)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Event Details Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Event Details
              </h3>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what happened, road conditions, weather, etc."
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Severity of Damages</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-6"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="slight" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Slight Damage
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="extensive" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Extensive Damage
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Photos of Damage Section */}
            <div className="space-y-4">
              <FormLabel>Photos of Damage</FormLabel>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Upload Images</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Click or drag to upload photos of the incident
                </p>
                <label htmlFor="file-upload">
                  <Button type="button" variant="outline" className="hover:bg-gray-100 hover:text-foreground" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </span>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
                {uploadedFiles.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    {uploadedFiles.length} file(s) uploaded
                  </p>
                )}
              </div>
            </div>

            {/* Third Party Involvement Section */}
            <div className="border-t pt-6 space-y-6">
              <FormField
                control={form.control}
                name="thirdPartyInvolved"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <FormLabel className="text-lg font-semibold cursor-pointer">
                        Third Party Involvement
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("thirdPartyInvolved") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <FormField
                    control={form.control}
                    name="thirdPartyCarOwner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Car Owner</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thirdPartyLicensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plate</FormLabel>
                        <FormControl>
                          <Input placeholder="123-45-678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thirdPartyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Anytown" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thirdPartyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="555-123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thirdPartyIdNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Driver's License or ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thirdPartyInsurance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Policy</FormLabel>
                        <FormControl>
                          <Input placeholder="Policy number and company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-8"
              >
                Submit Report
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
