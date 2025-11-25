import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const SnowflakeTest = () => {
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResults, setQueryResults] = useState<any>(null);
  const { toast } = useToast();

  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SQL query",
        variant: "destructive",
      });
      return;
    }

    setQueryLoading(true);
    setQueryResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("snowflake-query", {
        body: { query: sqlQuery },
      });

      if (error) throw error;

      setQueryResults(data);
      toast({
        title: "Success",
        description: "Query executed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to execute query",
        variant: "destructive",
      });
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-semibold text-slate-900 mb-2">Snowflake Query Executor</h3>
        <p className="text-slate-600">Enter your SQL query to execute against Snowflake</p>
      </div>

      {/* SQL Query Input */}
      <div className="space-y-4">
        <Textarea
          placeholder="Enter SQL query (e.g., SELECT * FROM table LIMIT 10)"
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          className="min-h-[120px] font-mono text-sm"
        />
        <Button onClick={handleExecuteQuery} disabled={queryLoading || !sqlQuery.trim()} className="w-full">
          <Play className="mr-2 h-4 w-4" />
          {queryLoading ? "Executing..." : "Execute Query"}
        </Button>
      </div>

      {/* Query Results */}
      {queryResults && (
        <div className="space-y-2">
          <h4 className="text-lg font-semibold text-slate-900">Results:</h4>
          <div className="bg-slate-50 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-xs font-mono">{JSON.stringify(queryResults, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
