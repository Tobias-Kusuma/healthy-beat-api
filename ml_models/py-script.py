import joblib
import wfdb
from biosppy.signals import ecg
import numpy as np
import sys

# Load the saved SVM model
svm_model = joblib.load('svm_model.pkl')

# Praproses data uji baru
def preprocess_data(data_path):
    # Baca sinyal EKG
    record = wfdb.rdrecord(data_path)

    # Batasan waktu yang diinginkan (misalnya, 5 detik pertama)
    start_time = 0
    end_time = 5

    # Hitung indeks yang sesuai untuk batasan waktu
    start_index = int(start_time * record.fs)
    end_index = int(end_time * record.fs)

    # Ambil sinyal EKG hanya dalam rentang waktu yang ditentukan
    signal = record.p_signal[start_index:end_index, 0]

    # Deteksi puncak R menggunakan algoritma Hamilton Segmenter
    rpeaks, = ecg.hamilton_segmenter(signal, sampling_rate=record.fs)

    # Mengukur interval QRS
    qrs_intervals = []
    for i in range(len(rpeaks) - 1):
        qrs_start = rpeaks[i]
        qrs_end = rpeaks[i + 1]
        qrs_interval = (qrs_end - qrs_start) / record.fs
        qrs_intervals.append(qrs_interval)

    # Nilai rerata Interval QRS
    average_qrs_interval = sum(qrs_intervals) / len(qrs_intervals)

    return np.array([[average_qrs_interval, len(rpeaks)]])

# Contoh penggunaan
data_uji_path = sys.argv[1]
data_uji_preprocessed = preprocess_data(data_uji_path)

# Gunakan model terbaik untuk memprediksi apakah data uji sehat atau sakit
hasil_prediksi = svm_model.predict(data_uji_preprocessed)

if hasil_prediksi == 0:
    print("Hasil deteksi menyatakan kondisi jantung SEHAT")
else:
    print("Hasil deteksi menyatakan kondisi jantung memiliki ARITMIA")