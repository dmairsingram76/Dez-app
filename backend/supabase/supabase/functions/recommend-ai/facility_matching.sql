select *
from facilities
where activity_types && :activity_types
and location <-> point(:lng, :lat) < 5000
limit 10;
