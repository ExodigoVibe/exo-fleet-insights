import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, FileText, Car, Upload, X, PenTool } from "lucide-react";
import {
  useCreateVehicleRequest,
  useUpdateVehicleRequest,
  useVehicleRequestsQuery,
} from "@/hooks/queries/useVehicleRequestsQuery";
import { useFormTemplatesQuery } from "@/hooks/queries/useFormTemplatesQuery";
import { useAuth } from "@/hooks/useAuth";
import { departments, getManagersByDepartment, getManagerByName } from "@/data/departmentManagers";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SignaturePad } from "@/components/SignaturePad";

const formSchema = z
  .object({
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
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be after or equal to start date",
    path: ["end_date"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function NewRequest() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [usageType, setUsageType] = useState<"single_use" | "permanent_driver">("single_use");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const createRequest = useCreateVehicleRequest();
  const updateRequest = useUpdateVehicleRequest();
  const { data: requests = [], isLoading: isLoadingRequest } = useVehicleRequestsQuery();
  const { data: formTemplates = [] } = useFormTemplatesQuery();
  const { user, isLoading: isLoadingAuth, isEmployee } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  // Get managers filtered by selected department
  const filteredManagers = selectedDepartment ? getManagersByDepartment(selectedDepartment) : [];

  // Filter form templates based on usage type
  // Map form usage_type to template usage_type values
  const templateUsageType = usageType === "permanent_driver" ? "permanent" : "single_use";
  const availableTemplates = formTemplates.filter(
    (template) =>
      template.is_active &&
      (template.usage_type === templateUsageType || template.usage_type === "both")
  );

  const selectedTemplate = formTemplates.find((t) => t.id === selectedTemplateId);

  // Debug: Log user data on component mount and when user changes
  useEffect(() => {
    console.log("NewRequest - User data:", user);
    console.log("NewRequest - isLoadingAuth:", isLoadingAuth);
    console.log("NewRequest - localStorage azureUser:", localStorage.getItem("azureUser"));
  }, [user, isLoadingAuth]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usage_type: "single_use",
      purpose: "",
      full_name: user?.name || "",
      job_title: "",
      department: "",
      phone_number: "",
      email: user?.email || "",
      department_manager: "",
      manager_email: "",
    },
  });

  // Load existing request data for edit mode OR auto-fill for new requests
  useEffect(() => {
    if (isEditMode && !isLoadingRequest && requests.length > 0) {
      const request = requests.find((r) => r.id === id);
      if (request) {
        form.reset({
          usage_type: request.usage_type as "single_use" | "permanent_driver",
          start_date: parseISO(request.start_date),
          end_date: request.end_date ? parseISO(request.end_date) : undefined,
          purpose: request.purpose || "",
          full_name: request.full_name,
          job_title: request.job_title || "",
          department: request.department,
          phone_number: request.phone_number || "",
          email: request.email || "",
          department_manager: request.department_manager || "",
          manager_email: request.manager_email || "",
        });
        setUsageType(request.usage_type as "single_use" | "permanent_driver");
        setSelectedDepartment(request.department);
        if (request.signed_template_id) {
          setSelectedTemplateId(request.signed_template_id);
        }
      }
    } else if (!isEditMode && !isLoadingAuth && user) {
      // Auto-fill user data from SSO for new requests
      console.log("Auto-filling form with user data:", user);
      form.reset({
        usage_type: "single_use",
        purpose: "",
        full_name: user.name || "",
        job_title: "",
        department: "",
        phone_number: "",
        email: user.email || "",
        department_manager: "",
        manager_email: "",
      });
    }
  }, [isEditMode, id, requests, isLoadingRequest, isLoadingAuth, user, form]);

  // Reset template selection when usage type changes
  useEffect(() => {
    setSelectedTemplateId("");
    setSignatureDataUrl(null);
  }, [usageType]);

  const uploadSignature = async (dataUrl: string): Promise<string | null> => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const fileName = `signatures/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('vehicle-request-files')
        .upload(fileName, blob, { contentType: 'image/png' });
      
      if (uploadError) {
        console.error("Signature upload error:", uploadError);
        return null;
      }
      
      const { data: urlData } = supabase.storage
        .from('vehicle-request-files')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error("Failed to upload signature:", error);
      return null;
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      console.log("Submitting request with data:", data);
      
      // Validate signature if template is selected
      if (selectedTemplateId && !signatureDataUrl && !isEditMode) {
        toast.error("Please sign the document before submitting");
        return;
      }
      
      // Upload files to storage
      const fileUrls: string[] = [];
      
      for (const file of uploadedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `files/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-request-files')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error("File upload error:", uploadError);
          toast.error(`Failed to upload file: ${file.name}`);
          continue;
        }
        
        const { data: urlData } = supabase.storage
          .from('vehicle-request-files')
          .getPublicUrl(filePath);
          
        fileUrls.push(urlData.publicUrl);
      }
      
      // Upload signature if present
      let signatureUrl: string | undefined;
      if (signatureDataUrl) {
        const uploadedSignatureUrl = await uploadSignature(signatureDataUrl);
        if (uploadedSignatureUrl) {
          signatureUrl = uploadedSignatureUrl;
        }
      }
      
      const requestData = {
        full_name: data.full_name,
        department: data.department,
        job_title: data.job_title,
        phone_number: data.phone_number,
        email: data.email,
        usage_type: data.usage_type,
        start_date: format(data.start_date, "yyyy-MM-dd"),
        end_date: format(data.end_date, "yyyy-MM-dd"),
        purpose: data.purpose,
        department_manager: data.department_manager,
        manager_email: data.manager_email,
        priority: "medium" as const,
        file_urls: fileUrls.length > 0 ? fileUrls : undefined,
        signature_url: signatureUrl,
        signed_at: signatureUrl ? new Date().toISOString() : undefined,
        signed_template_id: selectedTemplateId || undefined,
      };

      console.log("Formatted request data:", requestData);

      if (isEditMode && id) {
        console.log("Updating existing request with id:", id);
        await updateRequest.mutateAsync({ ...requestData, id });
      } else {
        console.log("Creating new request");
        await createRequest.mutateAsync(requestData);
      }

      console.log("Request submitted successfully, navigating to /requests");
      navigate("/requests");
    } catch (error) {
      console.error("Failed to submit request:", error);
      toast.error("Failed to submit request. Please try again.");
    }
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
            className="hover:bg-gray-100 hover:text-foreground"
          >
            Back to Requests
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{isEditMode ? "Edit Vehicle Request" : "New Vehicle Request"}</h1>
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
                              : "border-border hover:border-primary/50",
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
                              : "border-border hover:border-primary/50",
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

              <div
                className={cn(
                  "border rounded-lg p-4",
                  usageType === "single_use" ? "bg-blue-50 border-blue-200" : "bg-teal-50 border-teal-200",
                )}
              >
                <h3
                  className={cn("font-semibold mb-2", usageType === "single_use" ? "text-blue-900" : "text-teal-900")}
                >
                  Requirements for {usageType === "single_use" ? "Single Use" : "Permanent Driver"}:
                </h3>
                <ul className="space-y-1">
                  {requirements[usageType].map((req, index) => (
                    <li
                      key={index}
                      className={cn(
                        "text-sm flex items-start gap-2",
                        usageType === "single_use" ? "text-blue-800" : "text-teal-800",
                      )}
                    >
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
                                "w-full pl-3 text-left font-normal hover:bg-gray-100 hover:text-foreground",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? format(field.value, "dd/MM/yyyy") : <span>dd/mm/yyyy</span>}
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
                                "w-full pl-3 text-left font-normal hover:bg-gray-100 hover:text-foreground",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? format(field.value, "dd/MM/yyyy") : <span>dd/mm/yyyy</span>}
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
                      <Textarea placeholder="Enter the purpose of your trip" className="min-h-[80px]" {...field} />
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
                          <Input placeholder={!user?.name ? "Enter your full name" : ""} {...field} />
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
                        {isEmployee ? (
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedDepartment(value);
                              // Clear manager fields when department changes
                              form.setValue("department_manager", "");
                              form.setValue("manager_email", "");
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <FormControl>
                            <Input placeholder="Enter your department" {...field} />
                          </FormControl>
                        )}
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
                          <Input type="email" placeholder={!user?.email ? "Enter your email" : ""} {...field} />
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
                        {isEmployee ? (
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Auto-fill manager email when manager is selected
                              const manager = getManagerByName(value);
                              if (manager) {
                                form.setValue("manager_email", manager.email);
                              }
                            }}
                            disabled={!selectedDepartment}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedDepartment ? "Select manager" : "Select department first"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredManagers.map((manager) => (
                                <SelectItem key={manager.email} value={manager.displayName}>
                                  {manager.displayName} - {manager.jobTitle}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <FormControl>
                            <Input placeholder="Enter department manager name" {...field} />
                          </FormControl>
                        )}
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
                        {isEmployee ? (
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Auto-filled from manager selection" 
                              {...field} 
                              disabled
                              className="bg-muted"
                            />
                          </FormControl>
                        ) : (
                          <FormControl>
                            <Input type="email" placeholder="Enter manager's email" {...field} />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Card>

            {/* Document Signing Section */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PenTool className="h-5 w-5 text-primary" />
                Document Signing
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Document to Sign</label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a document template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTemplates.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No templates available for {usageType === "single_use" ? "Single Use" : "Permanent Driver"}
                        </SelectItem>
                      ) : (
                        availableTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.form_title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div className="space-y-4">
                    {/* Template Info */}
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">{selectedTemplate.form_title}</h4>
                      {selectedTemplate.description && (
                        <p className="text-sm text-muted-foreground mb-3">{selectedTemplate.description}</p>
                      )}
                      
                      {/* PDF Preview */}
                      {selectedTemplate.pdf_template_url && (
                        <div className="space-y-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setShowPdfPreview(!showPdfPreview)}
                          >
                            <FileText className="h-4 w-4" />
                            {showPdfPreview ? 'Hide Preview' : 'Preview PDF'}
                          </Button>
                          
                          {showPdfPreview && (
                            <div className="border rounded-lg overflow-hidden bg-white">
                              <iframe
                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedTemplate.pdf_template_url)}&embedded=true`}
                                className="w-full h-[400px]"
                                title="PDF Preview"
                                frameBorder="0"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Signature Section */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Your Signature</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        By signing below, you acknowledge that you have read and agree to the terms in the document above.
                      </p>
                      <SignaturePad onSignatureChange={setSignatureDataUrl} />
                      {signatureDataUrl && (
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                          Signature captured
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {availableTemplates.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No document templates are available for this usage type. You can proceed without signing.
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Required Forms</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Documents & Files</h4>
                  <div className="border-2 border-dashed border-border rounded-lg p-8">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Upload Documents</p>
                        <p className="text-sm text-muted-foreground">Driver's license, traffic history, or other required files</p>
                      </div>
                      <label htmlFor="file-upload">
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 hover:bg-gray-100 hover:text-foreground"
                          onClick={() => document.getElementById("file-upload")?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          Upload Files
                        </Button>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            const newFiles = Array.from(e.target.files);
                            setUploadedFiles([...uploadedFiles, ...newFiles]);
                            toast.success(`${newFiles.length} file(s) added`);
                          }
                        }}
                      />
                      {uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2 w-full">
                          <p className="text-sm text-muted-foreground text-center">
                            {uploadedFiles.length} file(s) selected
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
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
                className="hover:bg-gray-100 hover:text-foreground"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {isEditMode ? "Update Request" : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}