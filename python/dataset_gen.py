import attractors as at
h = at.Svensson()
df = at.trajectory(h.fn, 0, 0, a=1.4, b=1.56, c=1.40, d=-2.56, n=50_000_000)
df.x = df.x.astype('float32')*1000
df.y = df.y.astype('float32')*1000
df.to_parquet('./public/data.parquet')