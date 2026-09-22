INSERT INTO tb_jadwal_sesi (
    id, judul_sesi, id_kategori, id_pelatih, id_ruangan,
    waktu_mulai, waktu_selesai, kapasitas_maksimal, jumlah_terisi,
    harga_non_member, harga_member, batas_batal_jam, status_sesi
) VALUES 
(
    'c0000000-0000-0000-0000-000000000002',
    'Dynamic Reformer Core and Posture',
    'b0000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'd0000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP + INTERVAL '3 hours',
    CURRENT_TIMESTAMP + INTERVAL '4 hours 15 minutes',
    10, 8,
    225000, 110000, 12, 'terjadwal'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'Tibetan Sound Bath and Candlelight Yin',
    'b0000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'd0000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '2 hours',
    CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '3 hours 15 minutes',
    12, 3,
    185000, 85000, 24, 'terjadwal'
),
(
    'c0000000-0000-0000-0000-000000000004',
    'Heated Hydro Mineral Pool Recovery',
    'b0000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'd0000000-0000-0000-0000-000000000003',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '1 hour 30 minutes',
    8, 2,
    275000, 0, 24, 'terjadwal'
),
(
    'c0000000-0000-0000-0000-000000000005',
    'Cadillacs Apparatus Spinal Decompression (Priority Member Window)',
    'b0000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'd0000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    CURRENT_TIMESTAMP + INTERVAL '14 days' + INTERVAL '1 hour 15 minutes',
    6, 1,
    320000, 150000, 48, 'terjadwal'
)
ON CONFLICT (id) DO NOTHING;
