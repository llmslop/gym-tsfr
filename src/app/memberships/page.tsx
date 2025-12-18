"use client";

import { api } from "@/lib/eden";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CheckIcon } from "@heroicons/react/24/solid";
import { PackageDuration } from "@/lib/gym/package";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import PaymentForm from "@/components/memberships/PaymentForm";

function PricingCard({
    duration,
    price,
    features,
    isPopular = false,
    onChoosePlan,
}: {
    duration: PackageDuration;
    price: number;
    features: string[];
    isPopular?: boolean;
    onChoosePlan: () => void;
}) {
    const t = useTranslations("Membership");

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    return (
        <div
            className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                isPopular ? "border-2 border-primary scale-105" : ""
            }`}
        >
            {isPopular && (
                <div className="badge badge-primary absolute -top-3 left-1/2 -translate-x-1/2">
                    {t("popular")}
                </div>
            )}
            <div className="card-body">
                <h2 className="card-title text-2xl justify-center">
                    {t(`durations.${duration}`)}
                </h2>
                <div className="text-center my-4">
                    <p className="text-4xl font-bold text-primary">
                        {formatPrice(price)}
                    </p>
                    <p className="text-sm text-base-content/60 mt-1">
                        {t("perPeriod", { period: t(`durations.${duration}`) })}
                    </p>
                </div>

                <div className="divider"></div>

                <ul className="space-y-3 flex-grow">
                    {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                            <CheckIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{t(`features.${feature}`)}</span>
                        </li>
                    ))}
                </ul>

                <div className="card-actions justify-center mt-6">
                    <button
                        className={`btn ${isPopular ? "btn-primary" : "btn-outline btn-primary"} w-full`}
                        onClick={onChoosePlan}
                    >
                        {t("choosePlan")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function MembershipsPage() {
    const t = useTranslations("Membership");
    const tPayment = useTranslations("Payment");
    const router = useRouter();
    const { data: session } = authClient.useSession();
    
    const [selectedPackage, setSelectedPackage] = useState<{
        duration: PackageDuration;
        price: number;
    } | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const { data: packages, isLoading, error } = useQuery({
        queryKey: ["packages"],
        queryFn: async () => {
            const res = await api.packages.list.get();
            if (res.status === 200) {
                return res.data;
            }
            throw new Error("Failed to fetch packages");
        },
    });

    const handleChoosePlan = (duration: PackageDuration, price: number) => {
        if (!session?.user) {
            // Redirect to login if not authenticated
            router.push("/auth/login");
            return;
        }

        // Show payment modal if authenticated
        setSelectedPackage({ duration, price });
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setShowSuccessModal(true);
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        setSelectedPackage(null);
        router.push("/dashboard");
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="alert alert-error max-w-md">
                    <span>{t("errorLoading")}</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        {t("title")}
                    </h1>
                    <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {packages?.map((pkg) => (
                        <PricingCard
                            key={pkg.packageId}
                            duration={pkg.duration}
                            price={pkg.price}
                            features={pkg.features}
                            isPopular={pkg.duration === "3-months"}
                            onChoosePlan={() => handleChoosePlan(pkg.duration, pkg.price)}
                        />
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <div className="alert alert-info max-w-2xl mx-auto">
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
                            ></path>
                        </svg>
                        <span>{t("contactInfo")}</span>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedPackage && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">{tPayment("title")}</h3>
                        <PaymentForm
                            packageDuration={selectedPackage.duration}
                            packagePrice={selectedPackage.price}
                            onClose={() => {
                                setShowPaymentModal(false);
                                setSelectedPackage(null);
                            }}
                            onSuccess={handlePaymentSuccess}
                        />
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button
                            onClick={() => {
                                setShowPaymentModal(false);
                                setSelectedPackage(null);
                            }}
                        >
                            close
                        </button>
                    </form>
                </dialog>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mb-4">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-10 w-10 text-success-content"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h3 className="font-bold text-2xl mb-2">
                                {tPayment("successTitle")}
                            </h3>
                            <p className="text-base-content/70 mb-6">
                                {tPayment("successMessage")}
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={handleCloseSuccessModal}
                            >
                                {tPayment("goToDashboard")}
                            </button>
                        </div>
                    </div>
                </dialog>
            )}
        </>
    );
}