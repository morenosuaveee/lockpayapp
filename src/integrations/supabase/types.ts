export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_flags: {
        Row: {
          created_at: string
          created_by: string
          id: string
          notes: string | null
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_flags_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          email: string | null
          id: string
          processed_at: string | null
          reason: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          email?: string | null
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          email?: string | null
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      kyc_profiles: {
        Row: {
          country: string | null
          created_at: string
          id: string
          identity_status: string
          identity_verified_at: string | null
          legal_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          identity_status?: string
          identity_verified_at?: string | null
          legal_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          identity_status?: string
          identity_verified_at?: string | null
          legal_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_identifier: string
          created_at: string
          id: string
          is_default: boolean
          provider: Database["public"]["Enums"]["payment_provider"]
          user_id: string
        }
        Insert: {
          account_identifier: string
          created_at?: string
          id?: string
          is_default?: boolean
          provider?: Database["public"]["Enums"]["payment_provider"]
          user_id: string
        }
        Update: {
          account_identifier?: string
          created_at?: string
          id?: string
          is_default?: boolean
          provider?: Database["public"]["Enums"]["payment_provider"]
          user_id?: string
        }
        Relationships: []
      }
      payout_accounts: {
        Row: {
          created_at: string
          details_submitted: boolean
          payouts_enabled: boolean
          stripe_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details_submitted?: boolean
          payouts_enabled?: boolean
          stripe_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details_submitted?: boolean
          payouts_enabled?: boolean
          stripe_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_fees: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          sender_id: string
          stripe_payment_intent: string | null
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          sender_id: string
          stripe_payment_intent?: string | null
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          sender_id?: string
          stripe_payment_intent?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_fees_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          email_verified: boolean
          expo_push_token: string | null
          first_name: string | null
          id: string
          identity_verified_at: string | null
          last_name: string | null
          onboarding_completed_at: string | null
          paypal_email: string | null
          phone: string | null
          phone_number: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          privacy_policy_accepted_at: string | null
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean
          expo_push_token?: string | null
          first_name?: string | null
          id: string
          identity_verified_at?: string | null
          last_name?: string | null
          onboarding_completed_at?: string | null
          paypal_email?: string | null
          phone?: string | null
          phone_number?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          privacy_policy_accepted_at?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean
          expo_push_token?: string | null
          first_name?: string | null
          id?: string
          identity_verified_at?: string | null
          last_name?: string | null
          onboarding_completed_at?: string | null
          paypal_email?: string | null
          phone?: string | null
          phone_number?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          privacy_policy_accepted_at?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          claim_token: string | null
          created_at: string
          currency: string
          expires_at: string
          fee_amount: number
          id: string
          invite_sent_at: string | null
          max_attempts: number
          note: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          receiver_attempts: number
          receiver_confirmed: boolean
          recipient_channel: string | null
          recipient_confirmed_at: string | null
          recipient_id: string | null
          recipient_identifier: string
          released_at: string | null
          sender_attempts: number
          sender_confirmed: boolean
          sender_id: string
          sender_paypal_email: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          unlock_code_hash: string
          updated_at: string
        }
        Insert: {
          amount: number
          claim_token?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          fee_amount?: number
          id?: string
          invite_sent_at?: string | null
          max_attempts?: number
          note?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          receiver_attempts?: number
          receiver_confirmed?: boolean
          recipient_channel?: string | null
          recipient_confirmed_at?: string | null
          recipient_id?: string | null
          recipient_identifier: string
          released_at?: string | null
          sender_attempts?: number
          sender_confirmed?: boolean
          sender_id: string
          sender_paypal_email?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          unlock_code_hash: string
          updated_at?: string
        }
        Update: {
          amount?: number
          claim_token?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          fee_amount?: number
          id?: string
          invite_sent_at?: string | null
          max_attempts?: number
          note?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          receiver_attempts?: number
          receiver_confirmed?: boolean
          recipient_channel?: string | null
          recipient_confirmed_at?: string | null
          recipient_id?: string | null
          recipient_identifier?: string
          released_at?: string | null
          sender_attempts?: number
          sender_confirmed?: boolean
          sender_id?: string
          sender_paypal_email?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          unlock_code_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      unlock_attempts: {
        Row: {
          created_at: string
          id: string
          role: string
          success: boolean
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          success: boolean
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          success?: boolean
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unlock_attempts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_ledger: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          kind: string
          transaction_id: string | null
          user_id: string
          withdrawal_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          kind: string
          transaction_id?: string | null
          user_id: string
          withdrawal_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          kind?: string
          transaction_id?: string | null
          user_id?: string
          withdrawal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          status: string
          stripe_account_id: string | null
          stripe_transfer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          status?: string
          stripe_account_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          status?: string
          stripe_account_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_flag_counts: {
        Args: never
        Returns: {
          open_flags: number
          user_id: string
        }[]
      }
      admin_list_users: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: {
          created_at: string
          date_of_birth: string
          display_name: string
          email: string
          email_verified: boolean
          first_name: string
          id: string
          identity_status: string
          is_admin: boolean
          last_name: string
          onboarding_completed_at: string
          phone_number: string
          phone_verified: boolean
          privacy_policy_accepted_at: string
          terms_accepted_at: string
        }[]
      }
      admin_sender_flags: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          created_by_name: string
          id: string
          notes: string
          reason: string
          resolved_at: string
          severity: string
          status: string
          transaction_id: string
        }[]
      }
      admin_sender_summary: { Args: { _user_id: string }; Returns: Json }
      admin_sender_transfers: {
        Args: { _limit?: number; _user_id: string }
        Returns: {
          amount: number
          created_at: string
          currency: string
          expires_at: string
          failed_attempts: number
          fee_amount: number
          flag_count: number
          id: string
          invite_sent_at: string
          recipient_channel: string
          recipient_claimed: boolean
          recipient_confirmed_at: string
          recipient_id: string
          recipient_identifier: string
          recipient_name: string
          released_at: string
          status: Database["public"]["Enums"]["transaction_status"]
        }[]
      }
      claim_lookup: {
        Args: { _token: string }
        Returns: {
          amount: number
          currency: string
          expires_at: string
          fee_amount: number
          id: string
          invite_sent_at: string
          note: string
          recipient_channel: string
          recipient_confirmed_at: string
          recipient_identifier: string
          sender_display_name: string
          status: Database["public"]["Enums"]["transaction_status"]
        }[]
      }
      expire_old_transactions: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_txn_party: {
        Args: { _txn: Database["public"]["Tables"]["transactions"]["Row"] }
        Returns: boolean
      }
      lookup_recipient: {
        Args: { _channel: string; _identifier: string }
        Returns: Json
      }
      mark_invite_pending_payment: {
        Args: { _txn_id: string }
        Returns: {
          amount: number
          claim_token: string | null
          created_at: string
          currency: string
          expires_at: string
          fee_amount: number
          id: string
          invite_sent_at: string | null
          max_attempts: number
          note: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          receiver_attempts: number
          receiver_confirmed: boolean
          recipient_channel: string | null
          recipient_confirmed_at: string | null
          recipient_id: string | null
          recipient_identifier: string
          released_at: string | null
          sender_attempts: number
          sender_confirmed: boolean
          sender_id: string
          sender_paypal_email: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          unlock_code_hash: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      my_wallet_balance: { Args: never; Returns: number }
      recipient_confirm_claim: {
        Args: { _code_hash: string; _token: string }
        Returns: {
          amount: number
          claim_token: string | null
          created_at: string
          currency: string
          expires_at: string
          fee_amount: number
          id: string
          invite_sent_at: string | null
          max_attempts: number
          note: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          receiver_attempts: number
          receiver_confirmed: boolean
          recipient_channel: string | null
          recipient_confirmed_at: string | null
          recipient_id: string | null
          recipient_identifier: string
          released_at: string | null
          sender_attempts: number
          sender_confirmed: boolean
          sender_id: string
          sender_paypal_email: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          unlock_code_hash: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sync_my_verification: { Args: never; Returns: undefined }
      unlock_transaction: {
        Args: { _txn_id: string }
        Returns: {
          amount: number
          claim_token: string | null
          created_at: string
          currency: string
          expires_at: string
          fee_amount: number
          id: string
          invite_sent_at: string | null
          max_attempts: number
          note: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          receiver_attempts: number
          receiver_confirmed: boolean
          recipient_channel: string | null
          recipient_confirmed_at: string | null
          recipient_id: string | null
          recipient_identifier: string
          released_at: string | null
          sender_attempts: number
          sender_confirmed: boolean
          sender_id: string
          sender_paypal_email: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          unlock_code_hash: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      payment_provider: "paypal" | "venmo" | "bank"
      transaction_status:
        | "pending_payment"
        | "locked"
        | "awaiting_confirmation"
        | "completed"
        | "expired"
        | "cancelled"
        | "pending"
        | "unlocked"
        | "refunded"
        | "pending_invite"
        | "awaiting_recipient"
        | "recipient_confirmed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      payment_provider: ["paypal", "venmo", "bank"],
      transaction_status: [
        "pending_payment",
        "locked",
        "awaiting_confirmation",
        "completed",
        "expired",
        "cancelled",
        "pending",
        "unlocked",
        "refunded",
        "pending_invite",
        "awaiting_recipient",
        "recipient_confirmed",
      ],
    },
  },
} as const
