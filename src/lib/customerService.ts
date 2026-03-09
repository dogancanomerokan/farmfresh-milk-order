import { supabase } from "@/lib/supabaseClient";

export type CustomerOverviewRow = {
    user_id: string;
    full_name: string | null;
    phone: string | null;
    address: string | null;
    profile_created_at: string | null;
    is_frozen: boolean;
    frozen_reason: string | null;
    frozen_at: string | null;
    total_orders: number;
    total_spent: number;
    last_order_at: string | null;
    last_delivery_date: string | null;
    pending_orders: number;
    approved_orders: number;
    preparing_orders: number;
    delivering_orders: number;
    delivered_orders: number;
    cancelled_orders: number;
};

export type CustomerOrderHistoryRow = {
    order_id: string;
    user_id: string;
    guest_name: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    il: string;
    ilce: string;
    mahalle: string | null;
    address: string;
    delivery_date: string;
    time_slot: string;
    notes: string | null;
    status: string;
    total_amount: number;
    created_at: string;
    claimed_by_admin_id: string | null;
    claimed_at: string | null;
    delivered_by_admin_id: string | null;
    delivered_at: string | null;
    items: Array<{
        id: string;
        product_name_snapshot: string;
        volume_snapshot: string | null;
        unit_snapshot: string | null;
        quantity: number;
        unit_price: number | null;
        line_total: number | null;
    }>;
};

export async function getCustomers(search = "", frozenFilter = "all") {
    let query = supabase
        .from("customer_overview")
        .select("*");

    if (search.trim()) {
        const safe = search.trim();
        query = query.or(
            `full_name.ilike.%${safe}%,phone.ilike.%${safe}%,address.ilike.%${safe}%`
        );
    }

    if (frozenFilter === "frozen") {
        query = query.eq("is_frozen", true);
    }

    if (frozenFilter === "active") {
        query = query.eq("is_frozen", false);
    }

    const { data, error } = await query.order("last_order_at", {
        ascending: false,
        nullsFirst: false,
    });

    if (error) throw error;
    return (data || []) as CustomerOverviewRow[];
}

export async function getCustomerOrders(
    userId: string,
    statusFilter = "all"
) {
    let query = supabase
        .from("customer_order_history")
        .select("*")
        .eq("user_id", userId);

    if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as CustomerOrderHistoryRow[];
}

export async function freezeCustomer(
    userId: string,
    reason: string,
    adminId: string
) {
    const { error } = await supabase
        .from("customer_account_controls")
        .upsert(
            {
                user_id: userId,
                is_frozen: true,
                frozen_reason: reason || null,
                frozen_by_admin_id: adminId,
                frozen_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        );

    if (error) throw error;
}

export async function unfreezeCustomer(userId: string) {
    const { error } = await supabase
        .from("customer_account_controls")
        .update({
            is_frozen: false,
            frozen_reason: null,
            frozen_by_admin_id: null,
            frozen_at: null,
            updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

    if (error) throw error;
}

export async function cancelCustomerOrder(
    orderId: string,
    adminId: string,
    reason: string
) {
    const { error: updateError } = await supabase
        .from("orders")
        .update({
            status: "cancelled",
        })
        .eq("id", orderId);

    if (updateError) throw updateError;

    const { error: cancellationError } = await supabase
        .from("order_cancellations")
        .upsert(
            {
                order_id: orderId,
                cancelled_by_admin_id: adminId,
                cancellation_reason: reason || null,
                email_sent: false,
                email_sent_at: null,
            },
            { onConflict: "order_id" }
        );

    if (cancellationError) throw cancellationError;
}