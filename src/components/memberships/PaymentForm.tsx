"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@/lib/eden";
import { useToast } from "@/components/toast-context";

type PaymentMethod = "cash" | "bank-card" | "e-wallet";

interface PaymentFormProps {
    packageId: string;
    packageLabel: string;
    packagePrice: number;
    isRenewal?: boolean; // Thêm flag để phân biệt purchase vs renew
    onClose: () => void;
    onSuccess: (data: { receiptNo: string; memberCode: string }) => void;
}

export default function PaymentForm({
    packageId,
    packageLabel,
    packagePrice,
    isRenewal = false,
    onClose,
    onSuccess,
}: PaymentFormProps) {
    const t = useTranslations("Payment");
    const toast = useToast();

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank-card");

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);

    const submit = async () => {
        setIsProcessing(true);
        try {
            // Gọi API tùy theo loại (purchase hoặc renew)
            const endpoint = isRenewal ? api.memberships.renew : api.memberships.purchase;
            
            const res = await endpoint.post({
                packageId,
                paymentMethod,
            });

            if (res.status !== 200 || !res.data) {
                const msg = (res as any).error?.value?.message ?? "Payment failed";
                throw new Error(msg);
            }

            if (!res.data.receiptNo || !res.data.memberCode) {
                throw new Error("Invalid response: missing receipt number or member code");
            }

            onSuccess({ receiptNo: res.data.receiptNo, memberCode: res.data.memberCode });
        } catch (err: any) {
            toast({ type: "error", message: err?.message ?? "Payment failed" });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full max-w-2xl space-y-6">
            <div className="bg-base-200 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-lg">{packageLabel}</h3>
                        <p className="text-sm text-base-content/60">
                            {isRenewal ? t("renewalSummary") || "Renewing membership" : t("packageSummary")}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatPrice(packagePrice)}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-lg font-semibold">{t("paymentMethod")}</h3>
                <div className="join join-vertical w-full">
                    <label className="join-item btn justify-start">
                        <input
                            type="radio"
                            name="payment-method"
                            className="radio radio-primary"
                            checked={paymentMethod === "bank-card"}
                            onChange={() => setPaymentMethod("bank-card")}
                        />
                        <span className="ml-3">{t("methodCard")}</span>
                    </label>
                    <label className="join-item btn justify-start">
                        <input
                            type="radio"
                            name="payment-method"
                            className="radio radio-primary"
                            checked={paymentMethod === "e-wallet"}
                            onChange={() => setPaymentMethod("e-wallet")}
                        />
                        <span className="ml-3">{t("methodEwallet")}</span>
                    </label>
                    <label className="join-item btn justify-start">
                        <input
                            type="radio"
                            name="payment-method"
                            className="radio radio-primary"
                            checked={paymentMethod === "cash"}
                            onChange={() => setPaymentMethod("cash")}
                        />
                        <span className="ml-3">{t("methodCash")}</span>
                    </label>
                </div>
                <p className="text-sm text-base-content/60">{t("methodHint")}</p>
            </div>

            <div className="flex gap-4 justify-end pt-2">
                <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isProcessing}>
                    {t("cancel")}
                </button>
                <button type="button" className="btn btn-primary" onClick={submit} disabled={isProcessing}>
                    {isProcessing ? (
                        <>
                            <span className="loading loading-spinner"></span>
                            {t("processing")}
                        </>
                    ) : (
                        t("confirmPayment")
                    )}
                </button>
            </div>
        </div>
    );
}