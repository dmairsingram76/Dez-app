export async function deleteAccount() {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
  }
  