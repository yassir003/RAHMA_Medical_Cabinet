package com.cabinet.medical.config;

import com.cabinet.medical.service.rmi.ConsultationRemoteServiceImpl;
import com.cabinet.medical.service.rmi.IConsultationRemoteService;
import com.cabinet.medical.service.rmi.IPatientRemoteService;
import com.cabinet.medical.service.rmi.PatientRemoteServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.rmi.server.UnicastRemoteObject;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class RmiConfig {

    @Value("${rmi.registry.port}")
    private int rmiPort;

    private final PatientRemoteServiceImpl patientRemoteService;
    private final ConsultationRemoteServiceImpl consultationRemoteService;

    @PostConstruct
    public void startRmiRegistry() {
        try {
            Registry registry = LocateRegistry.createRegistry(rmiPort);
            IPatientRemoteService patientStub =
                (IPatientRemoteService) UnicastRemoteObject.exportObject(patientRemoteService, 0);
            IConsultationRemoteService consultationStub =
                (IConsultationRemoteService) UnicastRemoteObject.exportObject(consultationRemoteService, 0);
            registry.rebind("PatientRemoteService", patientStub);
            registry.rebind("ConsultationRemoteService", consultationStub);
            log.info("RMI registry started on port {}", rmiPort);
        } catch (Exception e) {
            log.warn("RMI registry could not be started: {}", e.getMessage());
        }
    }
}
