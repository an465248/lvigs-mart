"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { adminMock, type AdminSeller, type SellerDocument } from "@/lib/admin-mock";
import { formatINR, relativeTime } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowLeft, CheckCircle, XCircle, Store, User, MapPin, CreditCard,
  FileText, Shield, ExternalLink, Ban, AlertTriangle, Clock
} from "lucide-react";

const docTypeLabels: Record<string, string> = {
  PAN_CARD: "PAN Card",
  GST_CERTIFICATE: "GST Certificate",
  AADHAAR: "Aadhaar Card",
  ADDRESS_PROOF: "Address Proof",
  BANK_STATEMENT: "Bank Statement",
  BUSINESS_LICENSE: "Business License",
};

const kycStatusTone: Record<string, "success" | "warning" | "danger" | "muted" | "brand"> = {
  APPROVED: "success",
  SUBMITTED: "brand",
  NOT_STARTED: "muted",
  REJECTED: "danger",
};

const sellerStatusTone: Record<string, "success" | "warning" | "danger" | "muted" | "brand"> = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "danger",
  REJECTED: "danger",
};

export default function AdminSellerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [seller, setSeller] = useState<AdminSeller | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<SellerDocument | null>(null);

  useEffect(() => {
    const s = adminMock.getSeller(id);
    if (!s) { router.push("/admin/sellers"); return; }
    setSeller(s);
  }, [id, router]);

  const handleApprove = async () => {
    if (!confirm("Approve this seller and all their KYC documents?")) return;
    setActionLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const updated = adminMock.approveSeller(id);
    if (updated) setSeller(updated);
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const updated = adminMock.rejectSeller(id, rejectReason.trim());
    if (updated) setSeller(updated);
    setShowRejectModal(false);
    setRejectReason("");
    setActionLoading(false);
  };

  const handleSuspend = async () => {
    if (!confirm("Suspend this seller? They will no longer be able to sell on the platform.")) return;
    setActionLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const updated = adminMock.suspendSeller(id);
    if (updated) setSeller(updated);
    setActionLoading(false);
  };

  if (!seller) return <div className="flex h-64 items-center justify-center text-ink-500">Loading...</div>;

  const canApprove = seller.status === "PENDING" && seller.kycStatus === "SUBMITTED";
  const canReject = seller.status === "PENDING" && seller.kycStatus === "SUBMITTED";
  const canSuspend = seller.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <Link href="/admin/sellers" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to Sellers
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={seller.logo} alt="" className="h-16 w-16 rounded-xl object-cover" />
          <div>
            <h1 className="text-2xl font-bold">{seller.storeName}</h1>
            <p className="text-sm text-ink-500">{seller.description}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone={sellerStatusTone[seller.status]}>{seller.status}</Badge>
              <Badge tone={kycStatusTone[seller.kycStatus]}>KYC: {seller.kycStatus.replace(/_/g, " ")}</Badge>
              {seller.rating > 0 && (
                <span className="text-xs text-ink-500">
                  ★ {seller.rating} ({seller.ratingCount} ratings)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <Button onClick={handleApprove} loading={actionLoading}>
              <CheckCircle className="mr-1 h-4 w-4" /> Approve Seller
            </Button>
          )}
          {canReject && (
            <Button variant="danger" onClick={() => setShowRejectModal(true)} loading={actionLoading}>
              <XCircle className="mr-1 h-4 w-4" /> Reject
            </Button>
          )}
          {canSuspend && (
            <Button variant="danger" onClick={handleSuspend} loading={actionLoading}>
              <Ban className="mr-1 h-4 w-4" /> Suspend
            </Button>
          )}
        </div>
      </div>

      {/* Rejection Reason */}
      {seller.rejectionReason && (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20">
          <CardBody className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Rejection / Suspension Reason</p>
              <p className="text-sm text-rose-600 dark:text-rose-400">{seller.rejectionReason}</p>
              {seller.reviewedAt && (
                <p className="mt-1 text-xs text-rose-500">Reviewed {relativeTime(seller.reviewedAt)}</p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - KYC Documents */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> KYC Documents ({seller.documents.length})
              </CardTitle>
            </CardHeader>
            <CardBody>
              {seller.documents.length === 0 ? (
                <div className="py-8 text-center text-ink-500">
                  <Clock className="mx-auto mb-2 h-8 w-8 text-ink-300" />
                  <p className="text-sm">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {seller.documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 rounded-lg border p-4 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-700/50 transition cursor-pointer"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/30">
                        <FileText className="h-5 w-5 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{docTypeLabels[doc.type] || doc.type}</p>
                        <p className="text-xs text-ink-500">{doc.fileName} · Uploaded {relativeTime(doc.uploadedAt)}</p>
                        {doc.notes && (
                          <p className="mt-1 text-xs text-rose-500">{doc.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={kycStatusTone[doc.status]}>
                          {doc.status.replace(/_/g, " ")}
                        </Badge>
                        <ExternalLink className="h-4 w-4 text-ink-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Business Details
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-ink-500">Business Type</p>
                  <p className="text-sm font-medium">{seller.businessType.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">PAN Number</p>
                  <p className="text-sm font-medium font-mono">{seller.panNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">GST Number</p>
                  <p className="text-sm font-medium font-mono">{seller.gstNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Products</p>
                  <p className="text-sm font-medium">{seller.productCount}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Total Orders</p>
                  <p className="text-sm font-medium">{seller.orderCount}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Total Revenue</p>
                  <p className="text-sm font-medium">{seller.totalRevenue > 0 ? formatINR(seller.totalRevenue) : "—"}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Owner & Bank Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" /> Owner Information
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-sm font-bold text-ink-600 dark:bg-ink-700 dark:text-ink-300">
                  {seller.ownerName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold">{seller.ownerName}</p>
                  <p className="text-xs text-ink-500">{seller.ownerEmail}</p>
                </div>
              </div>
              <div className="border-t pt-3 dark:border-ink-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">Mobile</span>
                  <span className="font-medium">{seller.ownerMobile}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">Joined</span>
                  <span>{relativeTime(seller.createdAt)}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Address
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div className="text-sm space-y-1">
                <p>{seller.address}</p>
                <p>{seller.city}, {seller.state} - {seller.pincode}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Bank Account
              </CardTitle>
            </CardHeader>
            <CardBody>
              {seller.bankAccount ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-500">Account Holder</span>
                    <span className="font-medium">{seller.bankAccount.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-500">Account No.</span>
                    <span className="font-mono">{'••••' + seller.bankAccount.accountNumber.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-500">IFSC</span>
                    <span className="font-mono">{seller.bankAccount.ifsc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-500">Bank</span>
                    <span>{seller.bankAccount.bankName}</span>
                  </div>
                  {seller.bankAccount.upi && (
                    <div className="flex justify-between">
                      <span className="text-ink-500">UPI</span>
                      <span className="font-mono">{seller.bankAccount.upi}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink-500">No bank account provided</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-ink-800">
            <h3 className="text-lg font-bold">Reject Seller</h3>
            <p className="mt-1 text-sm text-ink-500">
              Please provide a reason for rejecting {seller.storeName}&apos;s application.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid PAN number, blurry documents..."
              className="input-base mt-4 h-24 resize-none"
            />
            <div className="mt-4 flex gap-3">
              <Button variant="outline" block onClick={() => { setShowRejectModal(false); setRejectReason(""); }}>
                Cancel
              </Button>
              <Button variant="danger" block onClick={handleReject} loading={actionLoading} disabled={!rejectReason.trim()}>
                Reject Seller
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewDoc(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-ink-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{docTypeLabels[previewDoc.type]}</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-ink-400 hover:text-ink-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-ink-500">{previewDoc.fileName}</p>
            <div className="mt-4 overflow-hidden rounded-lg border dark:border-ink-700">
              <img src={previewDoc.url} alt={docTypeLabels[previewDoc.type]} className="w-full object-contain" style={{ maxHeight: "60vh" }} />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Badge tone={kycStatusTone[previewDoc.status]}>
                {previewDoc.status.replace(/_/g, " ")}
              </Badge>
              <span className="text-xs text-ink-500">Uploaded {relativeTime(previewDoc.uploadedAt)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
