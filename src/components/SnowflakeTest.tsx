import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const SnowflakeTest = () => {
  const [query, setQuery] = useState("SELECT CURRENT_VERSION(), CURRENT_USER(), CURRENT_ROLE()");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const executeQuery = async () => {
    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("snowflake-query", {
        body: { query },
      });

      if (error) {
        console.error("Snowflake query error:", error);
        toast({
          title: "Query Failed",
          description: error.message || "Failed to execute Snowflake query",
          variant: "destructive",
        });
        return;
      }

      console.log("Snowflake query result:", data);
      setResults(data);
      toast({
        title: "Query Executed",
        description: `Retrieved ${data.rowCount || 0} rows`,
      });
    } catch (err) {
      console.error("Error calling edge function:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snowflake Connection Test</CardTitle>
        <CardDescription>
          Test your Snowflake connection by running a SQL query
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">SQL Query</label>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query..."
            className="font-mono text-sm"
            rows={4}
          />
        </div>

        <Button onClick={executeQuery} disabled={loading || !query.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Execute Query
        </Button>

        {results && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Rows returned: {results.rowCount || 0}
            </div>

            {results.rows && results.rows.length > 0 && (
              <div className="border rounded-md overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {results.columns?.map((col: any, idx: number) => (
                        <TableHead key={idx} className="font-semibold">
                          {col.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.rows.map((row: any[], rowIdx: number) => (
                      <TableRow key={rowIdx}>
                        {row.map((cell: any, cellIdx: number) => (
                          <TableCell key={cellIdx} className="font-mono text-xs">
                            {cell === null ? <span className="text-muted-foreground">NULL</span> : String(cell)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {results.error && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm text-destructive font-medium">Error:</p>
                <p className="text-sm text-destructive mt-1">{results.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
