import sqlite3

conn = sqlite3.connect('heritage.db')
c = conn.cursor()

updates = [
    (1, 'The Starry Night', 'Vincent van Gogh', '1889', '/paintings/starry_night.jpg'),
    (2, 'Mona Lisa', 'Leonardo da Vinci', '1503-1519', '/paintings/mona_lisa.jpg'),
    (3, 'The Great Wave off Kanagawa', 'Katsushika Hokusai', 'c. 1831', '/paintings/great_wave.jpg'),
    (4, 'Girl with a Pearl Earring', 'Johannes Vermeer', 'c. 1665', '/paintings/pearl_earring.jpg'),
]

for pid, title, artist, year, img in updates:
    c.execute(
        'UPDATE paintings SET title=?, artist=?, year=?, image_path=? WHERE id=?',
        (title, artist, year, img, pid)
    )

conn.commit()

c.execute('SELECT id, title, artist, year, image_path FROM paintings')
for row in c.fetchall():
    print(row)

conn.close()
print('DB updated successfully!')
