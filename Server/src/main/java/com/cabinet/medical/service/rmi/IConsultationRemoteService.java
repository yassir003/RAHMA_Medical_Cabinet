package com.cabinet.medical.service.rmi;

import com.cabinet.medical.dto.response.ConsultationResponse;

import java.rmi.Remote;
import java.rmi.RemoteException;
import java.util.List;
import java.util.Map;

public interface IConsultationRemoteService extends Remote {
    List<ConsultationResponse> getHistorique(Long patientId) throws RemoteException;
    ConsultationResponse getConsultationById(Long id) throws RemoteException;
    Map<String, Long> getStatsParMedecin() throws RemoteException;
}
