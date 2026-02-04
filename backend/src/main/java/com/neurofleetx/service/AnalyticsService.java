package com.neurofleetx.service;

import com.neurofleetx.dto.*;
import com.neurofleetx.model.AnalyticsDaily;
import com.neurofleetx.repository.AnalyticsDailyRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsDailyRepository analyticsDailyRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public RevenueChartDTO getRevenueData(String timeRange) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;

        switch (timeRange.toLowerCase()) {
            case "day":
                startDate = endDate.minusDays(1);
                return getHourlyRevenue(startDate, endDate);
            case "week":
                startDate = endDate.minusWeeks(1);
                return getDailyRevenue(startDate, endDate);
            case "month":
                startDate = endDate.minusMonths(1);
                return getWeeklyRevenue(startDate, endDate);
            case "year":
                startDate = endDate.minusYears(1);
                return getMonthlyRevenue(startDate, endDate);
            default:
                startDate = endDate.minusWeeks(1);
                return getDailyRevenue(startDate, endDate);
        }
    }

    private RevenueChartDTO getHourlyRevenue(LocalDate startDate, LocalDate endDate) {
        // For hourly data, we'll aggregate from bookings
        List<RevenueChartDTO.DataPoint> dataPoints = new ArrayList<>();

        // Simplified: Create hourly buckets with 0 revenue for now (removing dummy
        // random data)
        // A proper implementation would query bookings by hour.
        for (int hour = 0; hour < 24; hour += 4) {
            String label = String.format("%02d:00", hour);
            BigDecimal revenue = BigDecimal.ZERO;
            dataPoints.add(new RevenueChartDTO.DataPoint(label, revenue));
        }

        return calculateRevenueStats(dataPoints);
    }

    private RevenueChartDTO getDailyRevenue(LocalDate startDate, LocalDate endDate) {
        List<AnalyticsDaily> analytics = analyticsDailyRepository.findByDateBetweenOrderByDateAsc(startDate, endDate);

        List<RevenueChartDTO.DataPoint> dataPoints = analytics.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getDate().getDayOfWeek(),
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                AnalyticsDaily::getTotalRevenue,
                                BigDecimal::add)))
                .entrySet().stream()
                .map(entry -> new RevenueChartDTO.DataPoint(
                        entry.getKey().toString().substring(0, 3),
                        entry.getValue()))
                .collect(Collectors.toList());

        return calculateRevenueStats(dataPoints);
    }

    private RevenueChartDTO getWeeklyRevenue(LocalDate startDate, LocalDate endDate) {
        List<AnalyticsDaily> analytics = analyticsDailyRepository.findByDateBetweenOrderByDateAsc(startDate, endDate);

        // Group by week
        List<RevenueChartDTO.DataPoint> dataPoints = new ArrayList<>();
        int weekNum = 1;
        BigDecimal weekRevenue = BigDecimal.ZERO;

        for (AnalyticsDaily daily : analytics) {
            weekRevenue = weekRevenue.add(daily.getTotalRevenue());
            if (daily.getDate().getDayOfWeek().getValue() == 7) { // Sunday
                dataPoints.add(new RevenueChartDTO.DataPoint("Week " + weekNum, weekRevenue));
                weekRevenue = BigDecimal.ZERO;
                weekNum++;
            }
        }

        return calculateRevenueStats(dataPoints);
    }

    private RevenueChartDTO getMonthlyRevenue(LocalDate startDate, LocalDate endDate) {
        List<AnalyticsDaily> analytics = analyticsDailyRepository.findByDateBetweenOrderByDateAsc(startDate, endDate);

        List<RevenueChartDTO.DataPoint> dataPoints = analytics.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getDate().getMonth(),
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                AnalyticsDaily::getTotalRevenue,
                                BigDecimal::add)))
                .entrySet().stream()
                .map(entry -> new RevenueChartDTO.DataPoint(
                        entry.getKey().toString().substring(0, 3),
                        entry.getValue()))
                .collect(Collectors.toList());

        return calculateRevenueStats(dataPoints);
    }

    private RevenueChartDTO calculateRevenueStats(List<RevenueChartDTO.DataPoint> dataPoints) {
        BigDecimal total = dataPoints.stream()
                .map(RevenueChartDTO.DataPoint::getRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal average = dataPoints.isEmpty() ? BigDecimal.ZERO
                : total.divide(BigDecimal.valueOf(dataPoints.size()), 2, RoundingMode.HALF_UP);

        BigDecimal peak = dataPoints.stream()
                .map(RevenueChartDTO.DataPoint::getRevenue)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        return new RevenueChartDTO(dataPoints, total, average, peak);
    }

    public HeatmapDTO getHeatmapData(String timeRange) {
        LocalDate date = LocalDate.now();
        List<AnalyticsDaily> analytics = analyticsDailyRepository.findByDateOrderByTripsDesc(date);

        int totalTrips = analytics.stream()
                .mapToInt(AnalyticsDaily::getTotalTrips)
                .sum();

        List<HeatmapDTO.CityData> cities = analytics.stream()
                .map(a -> new HeatmapDTO.CityData(
                        a.getCity().getId(),
                        a.getCity().getName(),
                        a.getTotalTrips(),
                        a.getCity().getLatitude().doubleValue(),
                        a.getCity().getLongitude().doubleValue(),
                        totalTrips > 0 ? (a.getTotalTrips() * 100.0 / totalTrips) : 0.0))
                .collect(Collectors.toList());

        return new HeatmapDTO(cities);
    }

    public AdminStatsDTO getAdminStats(String timeRange) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = getStartDate(timeRange, endDate);

        BigDecimal totalRevenue = analyticsDailyRepository.getTotalRevenueForPeriod(startDate, endDate);
        if (totalRevenue == null)
            totalRevenue = BigDecimal.ZERO;

        Long totalTrips = analyticsDailyRepository.getTotalTripsForPeriod(startDate, endDate);
        if (totalTrips == null)
            totalTrips = 0L;

        Long activeVehicles = vehicleRepository.countByStatus(com.neurofleetx.model.Vehicle.VehicleStatus.AVAILABLE);
        Long totalCustomers = userRepository.count();

        // Calculate growth (Comparing with previous period requires more complex
        // queries, defaulting to 0 for now to remove dummy data)
        BigDecimal revenueGrowth = BigDecimal.ZERO;
        BigDecimal bookingGrowth = BigDecimal.ZERO;
        BigDecimal fleetUtilization = BigDecimal.ZERO;
        BigDecimal customerGrowth = BigDecimal.ZERO;

        if (totalTrips > 0 && activeVehicles > 0) {
            fleetUtilization = BigDecimal.valueOf(totalTrips)
                    .divide(BigDecimal.valueOf(activeVehicles * 30), 2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)); // Rough estimate
        }

        return new AdminStatsDTO(
                totalRevenue,
                totalTrips.intValue(),
                activeVehicles.intValue(),
                totalCustomers.intValue(),
                revenueGrowth,
                bookingGrowth,
                fleetUtilization,
                customerGrowth);
    }

    private LocalDate getStartDate(String timeRange, LocalDate endDate) {
        switch (timeRange.toLowerCase()) {
            case "day":
                return endDate.minusDays(1);
            case "week":
                return endDate.minusWeeks(1);
            case "month":
                return endDate.minusMonths(1);
            case "year":
                return endDate.minusYears(1);
            default:
                return endDate.minusWeeks(1);
        }
    }
}
