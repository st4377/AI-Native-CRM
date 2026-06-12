-- Database setup script
create or replace view customer_stats as
select
  c.id,
  c.name,
  c.email,
  c.phone,
  c.total_spent as total_spend,
  coalesce(o.order_count, 0) as order_count,
  o.last_order_date,
  case
    when o.last_order_date is null then null
    else extract(day from (now() - o.last_order_date))::int
  end as days_since_last_order
from customers c
left join (
  select customer_id, count(*) as order_count, max(order_date) as last_order_date
  from orders
  group by customer_id
) o on o.customer_id = c.id;