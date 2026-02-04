package com.neurofleetx.repository;

import com.neurofleetx.model.AnalyticsDaily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnalyticsDailyRepository extends JpaRepository<AnalyticsDaily, Long> {
    
    Optional<AnalyticsDaily> findByDateAndCityId(LocalDate date, Long cityId);
    
    List<AnalyticsDaily> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<AnalyticsDaily> findByDateBetweenOrderByDateAsc(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT a FROM AnalyticsDaily a WHERE a.date = :date ORDER BY a.totalTrips DESC")
    List<AnalyticsDaily> findByDateOrderByTripsDesc(@Param("date") LocalDate date);
    
    @Query("SELECT a FROM AnalyticsDaily a WHERE a.city.id = :cityId " +
           "AND a.date BETWEEN :startDate AND :endDate " +
           "ORDER BY a.date ASC")
    List<AnalyticsDaily> findByCityAndDateRange(
        @Param("cityId") Long cityId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    @Query("SELECT SUM(a.totalRevenue) FROM AnalyticsDaily a " +
           "WHERE a.date BETWEEN :startDate AND :endDate")
    java.math.BigDecimal getTotalRevenueForPeriod(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    
    @Query("SELECT SUM(a.totalTrips) FROM AnalyticsDaily a " +
           "WHERE a.date BETWEEN :startDate AND :endDate")
    Long getTotalTripsForPeriod(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
