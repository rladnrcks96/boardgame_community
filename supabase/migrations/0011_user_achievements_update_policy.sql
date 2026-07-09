create policy "users can mark own achievements notified"
  on user_achievements for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
