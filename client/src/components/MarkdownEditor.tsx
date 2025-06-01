import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Code, Link2, Eye, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "Write your content...", 
  minHeight = "200px" 
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector("textarea[data-markdown-editor]") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleBold = () => insertMarkdown("**", "**");
  const handleItalic = () => insertMarkdown("*", "*");
  const handleCode = () => insertMarkdown("`", "`");
  const handleLink = () => insertMarkdown("[", "](url)");

  const renderPreview = (text: string) => {
    // Simple markdown preview (basic implementation)
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "write" | "preview")}>
        <div className="border-b border-slate-200 px-3 py-2 bg-slate-50 flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBold}
              className="h-8 px-2"
            >
              <Bold className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleItalic}
              className="h-8 px-2"
            >
              <Italic className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCode}
              className="h-8 px-2"
            >
              <Code className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLink}
              className="h-8 px-2"
            >
              <Link2 className="h-3 w-3" />
            </Button>
          </div>
          
          <TabsList className="grid w-auto grid-cols-2 h-8">
            <TabsTrigger value="write" className="text-xs flex items-center space-x-1">
              <Edit className="h-3 w-3" />
              <span>Write</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="write" className="m-0">
          <Textarea
            data-markdown-editor
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="border-0 focus-visible:ring-0 resize-none rounded-none"
            style={{ minHeight }}
          />
        </TabsContent>
        
        <TabsContent value="preview" className="m-0">
          <div
            className="p-4 prose max-w-none"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{
              __html: value ? renderPreview(value) : `<p class="text-slate-500">${placeholder}</p>`
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
