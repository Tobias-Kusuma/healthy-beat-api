# import library untuk pengolahan sinyal
import wfdb
import numpy as np
from biosppy import storage
from biosppy.signals import ecg
import matplotlib.pyplot as plt

# import library untuk SVM
from sklearn import svm
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV
from sklearn.svm import SVC
import joblib

import sys

# Menentukan variabel
sample_rate = 256
recorded_data = []

# Membuka file .dat untuk dibaca
user_file = 'new-data' + ".dat"
raw_file = 'uploads/' + user_file
with open(raw_file, 'r') as file:
    # Membaca setiap baris dalam file
    lines = file.readlines()
    # Mengonversi setiap baris menjadi bilangan bulat
    data_list = [int(line.strip()) for line in lines if line.strip()]

# Memasukkan data ke array
for data in data_list:
    try:
        # Coba konversi ke float
        recorded_data.append(float(data))
    except ValueError:
        # Tangkap kesalahan jika konversi gagal
        pass

# Mengubah data yang tersimpan menjadi NumPy array dengan tipe data float
recorded_data = np.array(recorded_data, dtype=np.float64)

# Data yang telah direkam
recorded_data = np.array(recorded_data)

# Mengubah data ke format float
recorded_data = recorded_data.astype(float)

# Mengubah bentuk data menjadi dua dimensi (samples x leads)
recorded_data = recorded_data.reshape(-1, 1)

# Menentukan formatnya menjadi berapa bit
fmt = ['16']

# membuat header file WFDB dari data yang dikumpulkan
record_name = sys.argv[1]
wfdb.wrsamp(record_name, fs=sample_rate, units=['mV'], sig_name=['ECG'], p_signal=recorded_data, fmt=fmt)

# Membuat .dat file wfdb dari sinyal detak jantung
path = record_name
record = wfdb.rdrecord(path, channels=[0])

# Batasan waktu yang diinginkan (5 detik pertama)
start_time = 5
end_time = 10

# Hitung indeks yang sesuai untuk batasan waktu
start_index = int(start_time * record.fs)
end_index = int(end_time * record.fs)

plt.plot(record.p_signal[start_index:end_index])
plt.title('Uji Coba Plot EKG MIT-BIH')
plt.xlabel('Sampel')
plt.ylabel('Amplitudo')
plt.savefig('reports/' + record_name + ".jpeg") # menyimpan gambar grafik

# Melakukan klasifikasi dengan model svm
# Memanggil model SVM
svm_model = joblib.load('ml_models/svm_model.pkl')

def preprocess_data(data_path, window_size=5):
    record = wfdb.rdrecord(data_path)

    # Mendapatkan panjang total dari sinyalnya
    total_samples = len(record.p_signal)

    # Menetukan ukuran window dengan frekuensi dari sampelnya
    window_samples = window_size * record.fs

    # Inisiasi variabel untuk memulai ekstraksi fitur dari data
    start_index = 0
    end_index = window_samples

    # Membuat list untuk menyimpan hasil
    results = []

    while end_index <= total_samples:
        signal_window = record.p_signal[start_index:end_index, 0]

        # Handling NaN/infinity pada signal_window
        if not np.isnan(signal_window).all() and not np.isinf(signal_window).all():
            # Mendeteksi puncak R menggunakan Hamilton-Segmenter
            rpeaks, = ecg.hamilton_segmenter(signal_window, sampling_rate=record.fs)

            # Mengukur interval QRSnya
            qrs_intervals = [rpeaks[i + 1] - rpeaks[i] for i in range(len(rpeaks) - 1)]
            
            # Menghitung rerata QRSnya
            average_qrs_interval = np.mean(qrs_intervals) / record.fs

            # Menyimpan hasil dari 5 detik yang sudah dijalani
            results.append([average_qrs_interval, len(rpeaks)])

        # Sampel yang diambil 5 detik kemudian
        start_index += window_samples
        end_index += window_samples

    return np.array(results)

# Data yang digunakan
data_uji_preprocessed = preprocess_data(path)

# Handling NaN/Infinity pada data_uji_preprocessed
data_uji_preprocessed = np.nan_to_num(data_uji_preprocessed, nan=np.nanmean(data_uji_preprocessed))

# Penggunaan model untuk mendeteksi sampel tiap 5 detik
predictions = []

for data_window in data_uji_preprocessed:
    hasil_prediksi = svm_model.predict(data_window.reshape(1, -1))
    predictions.append(hasil_prediksi)

# Menghitung jumlah kemunculan masing-masing kelas
count_sehat = predictions.count(0)
count_sakit = predictions.count(1)

# Menentukan kelas yang memiliki frekuensi tertinggi
hasil_akhir = ""
if count_sehat > count_sakit:
    hasil_akhir = "Hasil deteksi dini dinyatakan SEHAT"
elif count_sakit > count_sehat:
    hasil_akhir = "Hasil deteksi dini dinyatakan SAKIT"
else:
    hasil_akhir = "Tidak dapat menentukan hasil secara pasti"

print(hasil_akhir)