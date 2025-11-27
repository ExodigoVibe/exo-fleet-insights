import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, FileText, Car, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formSchema = z.object({
  usage_type: z.enum(["single_use", "permanent_driver"]),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  end_date: z.date({
    required_error: "End date is required",
  }),
  purpose: z.string().min(1, "Purpose of trip is required").max(500),
  full_name: z.string().min(1, "Full name is required").max(100),
  job_title: z.string().min(1, "Job title is required").max(100),
  department: z.string().min(1, "Department is required").max(100),
  phone_number: z.string().min(1, "Phone number is required").max(20),
  email: z.string().email("Invalid email address").max(255),
  department_manager: z.string().min(1, "Department manager is required").max(100),
  manager_email: z.string().email("Invalid email address").max(255),
  license_file: z.any().optional(),
}).refine((data) => data.end_date >= data.start_date, {
  message: "End date must be after or equal to start date",
  path: ["end_date"],
});

type FormValues = z.infer<typeof formSchema>;

export default function NewRequest() {
  const navigate = useNavigate();
  const [usageType, setUsageType] = useState<"single_use" | "permanent_driver">("single_use");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usage_type: "single_use",
      purpose: "",
      full_name: "",
      job_title: "",
      department: "",
      phone_number: "",
      email: "",
      department_manager: "",
      manager_email: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    console.log("Form submitted:", data);
    toast.success("Request submitted successfully");
    // TODO: Save to database
    navigate("/requests");
  };

  const requirements = {
    single_use: [
      "Sign Exodigo Car Policy",
      "Upload driver's license photo",
      "Department manager approval",
      "Vehicle coordinator approval and code issuance",
    ],
    permanent_driver: [
      "Department manager approval",
      "Sign Exodigo Car Policy",
      "Sign Driver's File form",
      "Upload driver's license photo",
      "Upload traffic history check",
      "Vehicle coordinator approval and permanent code issuance",
    ],
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/requests")}
            className="hover:bg-muted"
          >
            Back to Requests
          </Button>
          <div>
            <h1 className="text-3xl font-bold">New Vehicle Request</h1>
            <p className="text-muted-foreground">Choose usage type and fill out the required details</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-center">Select Usage Type</h2>
              
              <FormField
                control={form.control}
                name="usage_type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange("single_use");
                            setUsageType("single_use");
                          }}
                          className={cn(
                            "p-4 border-2 rounded-lg flex items-center justify-center gap-2 transition-all",
                            field.value === "single_use"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <FileText className="h-5 w-5" />
                          <span className="font-medium">Single Use</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange("permanent_driver");
                            setUsageType("permanent_driver");
                          }}
                          className={cn(
                            "p-4 border-2 rounded-lg flex items-center justify-center gap-2 transition-all",
                            field.value === "permanent_driver"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <Car className="h-5 w-5" />
                          <span className="font-medium">Permanent Driver</span>
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={cn(
                "border rounded-lg p-4",
                usageType === "single_use" 
                  ? "bg-blue-50 border-blue-200" 
                  : "bg-teal-50 border-teal-200"
              )}>
                <h3 className={cn(
                  "font-semibold mb-2",
                  usageType === "single_use" ? "text-blue-900" : "text-teal-900"
                )}>
                  Requirements for {usageType === "single_use" ? "Single Use" : "Permanent Driver"}:
                </h3>
                <ul className="space-y-1">
                  {requirements[usageType].map((req, index) => (
                    <li key={index} className={cn(
                      "text-sm flex items-start gap-2",
                      usageType === "single_use" ? "text-blue-800" : "text-teal-800"
                    )}>
                      <span className={usageType === "single_use" ? "text-blue-600" : "text-teal-600"}>•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        Start Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>dd/mm/yyyy</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        End Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>dd/mm/yyyy</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Purpose of Trip
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the purpose of your trip"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Your Information</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your job title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your department" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department_manager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Manager</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter department manager name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="manager_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manager's Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter manager's email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Required Forms</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Driver's License</h4>
                  <div className="border-2 border-dashed border-border rounded-lg p-8">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Upload Driver's License Photo</p>
                        <p className="text-sm text-muted-foreground">PDF or image file</p>
                      </div>
                      <label htmlFor="license-upload">
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 hover:bg-muted"
                          onClick={() => document.getElementById('license-upload')?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          Upload File
                        </Button>
                      </label>
                      <input
                        id="license-upload"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLicenseFile(file);
                            form.setValue("license_file", file);
                            toast.success(`File "${file.name}" uploaded successfully`);
                          }
                        }}
                      />
                      {licenseFile && (
                        <p className="text-sm text-primary font-medium">
                          Selected: {licenseFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/requests")}
                className="hover:bg-muted"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Submit Request
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
