create policy "authenticated users can update wiki body"
  on games for update
  to authenticated
  using (true)
  with check (true);
