"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Star, MessageSquare, User } from "lucide-react";

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  body: string;
  productName?: string;
  createdAt: string;
}

const sampleReviews: Review[] = [
  { id: "1", userName: "Priya Sharma", rating: 5, title: "Excellent product!", body: "Great quality and fast delivery. The seller was very responsive.", productName: "iPhone 15 Pro Max", createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "2", userName: "Rahul Verma", rating: 4, title: "Good value", body: "Product matches description. Packaging could be better.", productName: "Samsung Galaxy S24", createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: "3", userName: "Neha Gupta", rating: 5, title: "Amazing!", body: "Best online shopping experience. Will buy again!", productName: "boAt Rockerz 450", createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: "4", userName: "Amit Patel", rating: 3, title: "Average", body: "Product is okay but delivery was delayed by 2 days.", productName: "MacBook Air M3", createdAt: new Date(Date.now() - 345600000).toISOString() },
];

export default function SellerReviewsPage() {
  const [reviews] = useState(sampleReviews);

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews & Ratings</h1>
        <p className="text-sm text-ink-500">Customer reviews for your store</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-3xl font-bold">{avgRating.toFixed(1)}</div>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-ink-300"}`} />
              ))}
            </div>
            <p className="text-xs text-ink-500 mt-1">{reviews.length} reviews</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-emerald-600">{reviews.filter(r => r.rating >= 4).length}</p>
            <p className="text-xs text-ink-500">Positive Reviews</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-rose-600">{reviews.filter(r => r.rating <= 2).length}</p>
            <p className="text-xs text-ink-500">Negative Reviews</p>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-4">
        {reviews.map(r => (
          <Card key={r.id}>
            <CardBody>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-700">
                  <User className="h-5 w-5 text-ink-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{r.userName}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-ink-300"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-ink-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.productName && <p className="text-xs text-ink-500 mt-0.5">Product: {r.productName}</p>}
                  {r.title && <p className="text-sm font-medium mt-1">{r.title}</p>}
                  <p className="text-sm text-ink-600 mt-1">{r.body}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
