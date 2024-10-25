import java.util.Scanner;

public class EcommerceWebsite {
    public static void main(String[] args) {
        Product[] products = {
            new Product("Laptop", 800),
            new Product("Phone", 500),
            new Product("Tablet", 300)
        };

        displayProducts(products);

        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter the number of products you want to buy: ");
        int numberOfProducts = scanner.nextInt();

        int totalPrice = calculateTotalPrice(products, numberOfProducts);
        System.out.println("Total price: " + totalPrice);
    }

    public static void displayProducts(Product[] products) {
        System.out.println("Available Products:");
        for (int i = 0; i < products.length; i++) {
            products[i].display();
        }
    }

    public static int calculateTotalPrice(Product[] products, int count) {
        int totalPrice = 0;
        for (int i = 0; i < count; i++) {
            totalPrice += products[i].price;
        }
        return totalPrice;
    }
}

class Product {
    String name;
    int price;

    public Product(String name, int price) {
        this.name = name;
        this.price = price;
    }

    public void display() {
        System.out.println("Product: " + name + ", Price: " + price);
    }
}
