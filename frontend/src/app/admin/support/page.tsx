"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Headphones, Search, MessageSquare, Clock, CheckCircle, AlertCircle, User } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  userName: string;
  userMobile: string;
  messages: { sender: string; message: string; time: string }[];
  createdAt: string;
}

const sampleTickets: Ticket[] = [
  {
    id: "t1", subject: "Order not received", category: "Order Issue", status: "OPEN", priority: "HIGH",
    userName: "Priya Sharma", userMobile: "9876543211",
    messages: [
      { sender: "customer", message: "I ordered iPhone 15 Pro Max 5 days ago but haven't received it yet. Order ID: LVIGS-9001", time: new Date(Date.now() - 3600000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "t2", subject: "Refund not processed", category: "Payment", status: "IN_PROGRESS", priority: "MEDIUM",
    userName: "Rahul Verma", userMobile: "9876543212",
    messages: [
      { sender: "customer", message: "I returned Samsung Galaxy S24 Ultra 3 days ago but haven't received refund yet.", time: new Date(Date.now() - 86400000).toISOString() },
      { sender: "admin", message: "We are processing your refund. It will be credited within 3-5 business days.", time: new Date(Date.now() - 43200000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "t3", subject: "Wrong product delivered", category: "Product", status: "RESOLVED", priority: "HIGH",
    userName: "Neha Gupta", userMobile: "9876543215",
    messages: [
      { sender: "customer", message: "I received a different color than what I ordered.", time: new Date(Date.now() - 172800000).toISOString() },
      { sender: "admin", message: "We apologize for the inconvenience. A replacement has been shipped.", time: new Date(Date.now() - 86400000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  WAITING_FOR_CUSTOMER: "bg-violet-100 text-violet-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-ink-100 text-ink-500",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-ink-100 text-ink-500",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-rose-100 text-rose-700",
  URGENT: "bg-rose-600 text-white",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState(sampleTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [reply, setReply] = useState("");

  const filtered = filter === "ALL" ? tickets : tickets.filter(t => t.status === filter);

  const handleReply = () => {
    if (!selectedTicket || !reply.trim()) return;
    const newMessage = { sender: "admin", message: reply, time: new Date().toISOString() };
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, messages: [...t.messages, newMessage] } : t));
    setSelectedTicket(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
    setReply("");
  };

  const updateStatus = (ticketId: string, status: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status } : null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Support</h1>
          <p className="text-sm text-ink-500">Manage support tickets</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filter === f ? "bg-accent-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-700"}`}
              >
                {f.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map(t => (
              <Card
                key={t.id}
                className={`cursor-pointer transition ${selectedTicket?.id === t.id ? "ring-2 ring-accent-500" : ""}`}
                onClick={() => setSelectedTicket(t)}
              >
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.subject}</p>
                      <p className="text-xs text-ink-500">{t.userName} · {t.category}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[t.status]}`}>{t.status.replace(/_/g, " ")}</span>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityColors[t.priority]}`}>{t.priority}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card>
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b dark:border-ink-700">
                <div>
                  <h2 className="font-bold">{selectedTicket.subject}</h2>
                  <p className="text-xs text-ink-500">{selectedTicket.userName} · {selectedTicket.userMobile} · {selectedTicket.category}</p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={e => updateStatus(selectedTicket.id, e.target.value)}
                    className="rounded-lg border bg-white px-2 py-1 text-xs dark:border-ink-700 dark:bg-ink-800"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
                {selectedTicket.messages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${m.sender === "admin" ? "bg-accent-100 dark:bg-accent-950/30" : "bg-ink-100 dark:bg-ink-700"}`}>
                      <p className="text-xs font-semibold text-ink-500 mb-1">{m.sender === "admin" ? "Admin" : selectedTicket.userName}</p>
                      <p className="text-sm">{m.message}</p>
                      <p className="text-[10px] text-ink-400 mt-1">{new Date(m.time).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t dark:border-ink-700 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleReply()}
                    className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-800"
                  />
                  <Button onClick={handleReply}>Reply</Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-16">
                <Headphones className="h-12 w-12 text-ink-300 mb-4" />
                <p className="text-ink-500">Select a ticket to view details</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
