"use client";

import { useState } from "react";
import { Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Employee } from "@/lib/types";
import { cn } from "@/lib/utils";

interface EmployeeSelectorProps {
  employees: Employee[];
  activeEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
  onAddEmployee: (name: string) => void;
}

export function EmployeeSelector({
  employees,
  activeEmployeeId,
  onSelectEmployee,
  onAddEmployee,
}: EmployeeSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (newName.trim()) {
      onAddEmployee(newName.trim());
      setNewName("");
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") setIsAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {employees.map((emp) => {
        const isActive = emp.id === activeEmployeeId;
        return (
          <Button
            key={emp.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectEmployee(emp.id)}
            className={cn(
              "gap-2 rounded-xl transition-all h-9 pl-2",
              isActive && "shadow-md bg-primary text-primary-foreground",
              !isActive && "text-muted-foreground hover:text-foreground"
            )}
          >
            {emp.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={emp.image} alt={emp.name} className="h-5 w-5 rounded-full object-cover border border-border/50 bg-background/50" />
            ) : (
              <User className="h-4 w-4" />
            )}
            {emp.name}
            <span className="ml-1 text-xs opacity-60">
              ({emp.entries.length})
            </span>
          </Button>
        );
      })}

      {isAdding ? (
        <div className="flex items-center gap-2 animate-fade-in">
          <Input
            autoFocus
            placeholder="Employee name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newName.trim()) setIsAdding(false);
            }}
            className="h-9 w-40 rounded-xl text-sm"
          />
          <Button size="sm" onClick={handleAdd} className="h-9 rounded-xl">
            Save
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="gap-2 rounded-xl border-dashed h-9 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      )}
    </div>
  );
}
