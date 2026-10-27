export interface Database {
  public: {
    Tables: {
      print_shops: {
        Row: {
          id: string;
          name: string;
          location: string;
          distance: string;
          rating: number;
          jobs_count: string;
          status_badge: string;
          image: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location: string;
          distance?: string;
          rating?: number;
          jobs_count?: string;
          status_badge?: string;
          image: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['print_shops']['Insert']>;
      };
      print_jobs: {
        Row: {
          id: string;
          token: string;
          file_name: string;
          file_size: string;
          page_count: number;
          copies: number;
          color_mode: 'bw' | 'color';
          total_price: number;
          shop_id: string;
          status:
            | 'draft'
            | 'ready_for_scan'
            | 'scanned'
            | 'viewing'
            | 'printing'
            | 'completed_purged'
            | 'revoked';
          is_masked_aadhaar: boolean;
          sha256_hash: string;
          verification_key: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          token: string;
          file_name: string;
          file_size: string;
          page_count: number;
          copies: number;
          color_mode: 'bw' | 'color';
          total_price: number;
          shop_id: string;
          status?: Database['public']['Tables']['print_jobs']['Row']['status'];
          is_masked_aadhaar?: boolean;
          sha256_hash: string;
          verification_key: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['print_jobs']['Insert']>;
      };
      purge_receipts: {
        Row: {
          id: string;
          job_id: string;
          token: string;
          file_name: string;
          shop_name: string;
          shop_location: string;
          page_count: number;
          color_mode: string;
          total_price: number;
          status: 'Done' | 'Access ended';
          verification_key: string;
          audit_trail: any;
          shredded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          token: string;
          file_name: string;
          shop_name: string;
          shop_location: string;
          page_count: number;
          color_mode: string;
          total_price: number;
          status: 'Done' | 'Access ended';
          verification_key: string;
          audit_trail?: any;
          shredded_at?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['purge_receipts']['Insert']>;
      };
    };
  };
}
