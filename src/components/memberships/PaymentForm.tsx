"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Package, PackageDuration, packageDurations } from "@/lib/gym/package";

const paymentSchema = z.object({
    cardNumber: z.string().min(16, "Card number must be at least 16 digits").max(19, "Card number must be at most 19 digits"),
    cardHolder: z.string().min(3, "Card holder name is required"),
    expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "Invalid format (MM/YY)"),
    cvv: z.string().min(3, "CVV must be 3 digits").max(4, "CVV must be at most 4 digits"),
    billingAddress: z.string().min(10, "Please enter a valid address"),
    city: z.string().min(2, "City is required"),
    zipCode: z.string().min(4, "Zip code is required"),
    country: z.string().min(2, "Country is required"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
    packageDuration: PackageDuration;
    packagePrice: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PaymentForm({ packageDuration, packagePrice, onClose, onSuccess }: PaymentFormProps) {
    const t = useTranslations("Payment");
    const tMembership = useTranslations("Membership");
    const [isProcessing, setIsProcessing] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,19}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCardNumber(e.target.value);
        setValue('cardNumber', formatted);
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length >= 2) {
            value = value.slice(0, 2) + "/" + value.slice(2, 4);
        }
        setValue("expiryDate", value);
    };

    const onSubmit = async (data: PaymentFormData) => {
        setIsProcessing(true);

        // simulate payment processing delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("Payment data submitted:", data);
        console.log("Selected package:", packageDuration, packagePrice);

        setIsProcessing(false);
        onSuccess();
    };

    return (
        <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Package Summary */}
            <div className="bg-base-200 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-lg">
                    {tMembership(`durations.${packageDuration}`)}
                    </h3>
                    <p className="text-sm text-base-content/60">{t("packageSummary")}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                    {formatPrice(packagePrice)}
                    </p>
                </div>
                </div>
            </div>

            {/* Card Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("cardInformation")}</h3>
                
                {/* Card Number */}
                <div className="form-control">
                <label className="label">
                    <span className="label-text">{t("cardNumber")}</span>
                </label>
                <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className={`input input-bordered ${errors.cardNumber ? "input-error" : ""}`}
                    maxLength={19}
                    {...register("cardNumber")}
                    onChange={handleCardNumberChange}
                />
                {errors.cardNumber && (
                    <label className="label">
                    <span className="label-text-alt text-error">
                        {errors.cardNumber.message}
                    </span>
                    </label>
                )}
                </div>

                {/* Card Holder */}
                <div className="form-control">
                <label className="label">
                    <span className="label-text">{t("cardHolder")}</span>
                </label>
                <input
                    type="text"
                    placeholder="NGUYEN VAN A"
                    className={`input input-bordered ${errors.cardHolder ? "input-error" : ""}`}
                    {...register("cardHolder")}
                />
                {errors.cardHolder && (
                    <label className="label">
                    <span className="label-text-alt text-error">
                        {errors.cardHolder.message}
                    </span>
                    </label>
                )}
                </div>

                {/* Expiry Date and CVV */}
                <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                    <label className="label">
                    <span className="label-text">{t("expiryDate")}</span>
                    </label>
                    <input
                    type="text"
                    placeholder="MM/YY"
                    className={`input input-bordered ${errors.expiryDate ? "input-error" : ""}`}
                    maxLength={5}
                    {...register("expiryDate")}
                    onChange={handleExpiryChange}
                    />
                    {errors.expiryDate && (
                    <label className="label">
                        <span className="label-text-alt text-error">
                        {errors.expiryDate.message}
                        </span>
                    </label>
                    )}
                </div>

                <div className="form-control">
                    <label className="label">
                    <span className="label-text">{t("cvv")}</span>
                    </label>
                    <input
                    type="text"
                    placeholder="123"
                    className={`input input-bordered ${errors.cvv ? "input-error" : ""}`}
                    maxLength={4}
                    {...register("cvv")}
                    />
                    {errors.cvv && (
                    <label className="label">
                        <span className="label-text-alt text-error">
                        {errors.cvv.message}
                        </span>
                    </label>
                    )}
                </div>
                </div>
            </div>

            {/* Billing Address */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("billingAddress")}</h3>

                {/* Street Address */}
                <div className="form-control">
                <label className="label">
                    <span className="label-text">{t("address")}</span>
                </label>
                <input
                    type="text"
                    placeholder="123 Nguyen Hue Street"
                    className={`input input-bordered ${errors.billingAddress ? "input-error" : ""}`}
                    {...register("billingAddress")}
                />
                {errors.billingAddress && (
                    <label className="label">
                    <span className="label-text-alt text-error">
                        {errors.billingAddress.message}
                    </span>
                    </label>
                )}
                </div>

                {/* City and Zip */}
                <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                    <label className="label">
                    <span className="label-text">{t("city")}</span>
                    </label>
                    <input
                    type="text"
                    placeholder="Ho Chi Minh"
                    className={`input input-bordered ${errors.city ? "input-error" : ""}`}
                    {...register("city")}
                    />
                    {errors.city && (
                    <label className="label">
                        <span className="label-text-alt text-error">
                        {errors.city.message}
                        </span>
                    </label>
                    )}
                </div>

                <div className="form-control">
                    <label className="label">
                    <span className="label-text">{t("zipCode")}</span>
                    </label>
                    <input
                    type="text"
                    placeholder="700000"
                    className={`input input-bordered ${errors.zipCode ? "input-error" : ""}`}
                    {...register("zipCode")}
                    />
                    {errors.zipCode && (
                    <label className="label">
                        <span className="label-text-alt text-error">
                        {errors.zipCode.message}
                        </span>
                    </label>
                    )}
                </div>
                </div>

                {/* Country */}
                <div className="form-control">
                <label className="label">
                    <span className="label-text">{t("country")}</span>
                </label>
                <input
                    type="text"
                    placeholder="Vietnam"
                    className={`input input-bordered ${errors.country ? "input-error" : ""}`}
                    {...register("country")}
                />
                {errors.country && (
                    <label className="label">
                    <span className="label-text-alt text-error">
                        {errors.country.message}
                    </span>
                    </label>
                )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
                <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={onClose}
                disabled={isProcessing}
                >
                {t("cancel")}
                </button>
                <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={isProcessing}
                >
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

            {/* Security Notice */}
            <div className="alert alert-info">
                <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
                >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                </svg>
                <span className="text-sm">{t("securityNotice")}</span>
            </div>
            </form>
        </div>
    );
}