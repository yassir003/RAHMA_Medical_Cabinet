package com.cabinet.medical.service.rmi;

import com.cabinet.medical.dto.response.DashboardStatsResponse;
import com.cabinet.medical.dto.response.PatientResponse;

import java.rmi.Remote;
import java.rmi.RemoteException;
import java.util.List;

public interface IPatientRemoteService extends Remote {
    PatientResponse getPatientById(Long id) throws RemoteException;
    List<PatientResponse> searchPatients(String query) throws RemoteException;
    DashboardStatsResponse getStatistiques() throws RemoteException;
}
