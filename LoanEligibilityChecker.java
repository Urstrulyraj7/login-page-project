import java.util.Scanner;

public class LoanEligibilityChecker {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // Input income and credit score
        System.out.print("Enter your income: ");
        double income = scanner.nextDouble();

        System.out.print("Enter your credit score: ");
        int creditScore = scanner.nextInt();

        // Check eligibility
        if (income >= 50000 && creditScore >= 700) {
            System.out.println("You are eligible for the loan.");
        } else {
            System.out.println("You are not eligible for the loan.");
        }

        scanner.close();
    }
}
