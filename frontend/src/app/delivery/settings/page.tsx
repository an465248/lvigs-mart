"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, Truck, Bell, Shield } from "lucide-react";

export default function DeliverySettingsPage() {
  const [profile, setProfile] = useState({
    name: "Rajesh Kumar",
    mobile: "9876543210",
    email: "rajesh@example.com",
    vehicleType: "BIKE",
    vehicleNumber: "KA01AB1234",
    city: "Bengaluru",
    state: "Karnataka",
  });

  const set = (k: string, v: string) => setProfile(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <User className="h-5 w-5 text-ink-400" />
          <h2 className="font-bold">Profile</h2>
        </div>
        <CardBody className="space-y-4">
          <Input label="Name" value={profile.name} onChange={e => set("name", e.target.value)} />
          <Input label="Mobile" value={profile.mobile} onChange={e => set("mobile", e.target.value)} />
          <Input label="Email" type="email" value={profile.email} onChange={e => set("email", e.target.value)} />
          <Button>Save Profile</Button>
        </CardBody>
      </Card>

      <Card>
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <Truck className="h-5 w-5 text-ink-400" />
          <h2 className="font-bold">Vehicle</h2>
        </div>
        <CardBody className="space-y-4">
          <Input label="Vehicle Type" value={profile.vehicleType} onChange={e => set("vehicleType", e.target.value)} />
          <Input label="Vehicle Number" value={profile.vehicleNumber} onChange={e => set("vehicleNumber", e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="City" value={profile.city} onChange={e => set("city", e.target.value)} />
            <Input label="State" value={profile.state} onChange={e => set("state", e.target.value)} />
          </div>
          <Button>Save Vehicle Details</Button>
        </CardBody>
      </Card>
    </div>
  );
}
