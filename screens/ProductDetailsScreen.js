import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

 
const ProductDetailsScreen = ({ route }) => {
  const navigation = useNavigation();

  const [product, setProduct] = useState(null);
  const [productName, setProductName] = useState(null);
  const [nonVeganIngredients, setNonVeganIngredients] = useState([]);
  const [isVegan, setIsVegan] = useState(null);

  const { barcode } = route.params;
  const USDA_API_KEY = 'noh8FAlXImM3k5Nub4C24J1G75g7PF19IchnlAwC';
  const [fetchStatus, setFetchStatus] = useState("");


  useEffect(() => {
    const fetchProduct = async () => {
      let productFound = false;
      // Open Food Facts
    
      try {
        const openFoodFactsResponse = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
  
        if (openFoodFactsResponse.data.product) {
          productFound = true;
          setProduct(openFoodFactsResponse.data.product);
          setProductName(openFoodFactsResponse.data.product.product_name);
  
          const ingredients = openFoodFactsResponse.data.product.ingredients
            ? openFoodFactsResponse.data.product.ingredients.map((i) => i.text.trim().toLowerCase())
            : [];
  
          checkVeganStatus({
            ...openFoodFactsResponse.data.product,
            ingredients: ingredients,
          });
          return;
        }
      } catch (error) {
        console.error('Error fetching from Open Food Facts:', error);
      }
  
      // Open Beauty Facts
      try {
        const openBeautyFactsResponse = await axios.get(`https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`);
  
        if (openBeautyFactsResponse.data.product) {
          productFound = true;
          setProduct(openBeautyFactsResponse.data.product);
          setProductName(openBeautyFactsResponse.data.product.product_name);
          checkVeganStatus({
            ...openBeautyFactsResponse.data.product,
            ingredients: openBeautyFactsResponse.data.product.ingredients.map((i) =>
              i.text.trim().toLowerCase()
            ),
          });
          return;
        }
      } catch (error) {
        console.error(error);
      }
  
      // USDA FoodData Central
      try {
        const usdaResponse = await axios.get(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${barcode}&api_key=${USDA_API_KEY}`);
  
        if (usdaResponse.data.foods.length > 0) {
          productFound = true;
          const usdaProduct = usdaResponse.data.foods[0];
          const ingredients = usdaProduct.ingredients
            ? usdaProduct.ingredients.split(';').map((i) => i.trim().toLowerCase())
            : [];
  
          setProduct(usdaProduct);
          setProductName(usdaProduct.description);
          checkVeganStatus({ ...usdaProduct, ingredients });
          return;
        }
      } catch (error) {
        console.error( error);
      }
  
      
    
        // Own Database
        try {
          const ownDatabaseResponse = await axios.get(`http://192.168.1.6:5000/api/products/${barcode}`);
          console.log('Own database response:', ownDatabaseResponse.data);
  
          if (ownDatabaseResponse.data) {
            productFound = true;
            setProduct(ownDatabaseResponse.data);
            setProductName(ownDatabaseResponse.data.name);
            const ingredients = ownDatabaseResponse.data.ingredients.map((i) => i.trim().toLowerCase());
            checkVeganStatus({
              ...ownDatabaseResponse.data,
              ingredients: ingredients,
            });
            return;
          }
          
        } catch (error) {
          setIsVegan(null);
        }
        if (!productFound) {
          setFetchStatus("Бүтээгдэхүүний мэдээлэл олдсонгүй");
          setProduct(null);
          setProductName(null);
          setIsVegan(null);
        }
    }
   if (barcode) {
        fetchProduct();
      }
    }, [barcode]);
    
  
    const checkVeganStatus = async (product) => {
      try {
        let ingredients = product.ingredients 
          ? product.ingredients.map(i => i.replace(/\s/g, '').split(/,|\(|\)/)).flat().filter(Boolean)
          : [];
        console.log('Checking vegan status for product:', product);
    
        if (
          (product.labels_hierarchy && product.labels_hierarchy.includes('en:vegan')) ||
          (product.categories_hierarchy && product.categories_hierarchy.includes('en:vegan'))
        ) {
          setIsVegan(true);
          return;
        }
    
        if (ingredients.length === 0) {
          console.warn('Ingredients not available');
          setIsVegan(null);
          return;
        }
    
        const response = await axios.post('http://192.168.1.6:5000/api/check-vegan', {
          ingredients,
        });
        setIsVegan(response.data.isVegan);
        setNonVeganIngredients(response.data.nonVeganIngredients);
      } catch (error) {
        console.error('Error checking vegan status:', error);
        setIsVegan(false);
       
      }
    };
    
    const getIngredientsText = () => {
      let ingredients;
      if (product.ingredients_text) {
        console.log('ingredients_text branch executed');
        ingredients = product.ingredients_text;
      } 
      if (product.foodNutrients && Array.isArray(product.foodNutrients)) {
        console.log('foodNutrients branch executed');
        ingredients = product.foodNutrients.map(nutrient => nutrient.nutrientName);
      } 
      if (!ingredients && product.ingredients && product.ingredients.length > 0) {
        console.log('ingredients branch executed');
        ingredients = product.ingredients;
      } 
      if (!ingredients && product.ingredients_from_own_database && product.ingredients_from_own_database.length > 0) {
        console.log('ingredients_from_own_database branch executed');
        ingredients = product.ingredients_from_own_database;
      }
      
      if (ingredients) {
        if (typeof ingredients === 'string') {
            ingredients = ingredients.split(/,(?![^()]*\))|\(|\)/).filter(Boolean);
        } else if (Array.isArray(ingredients)) {
            ingredients = ingredients.map(i => typeof i === 'string' ? i.split(/,(?![^()]*\))|\(|\)/) : []).flat().filter(Boolean);
        }
    
        // Trim extra spaces from each ingredient and remove numerical or percentage values
        ingredients = ingredients.map(i => i.replace(/[\d.%]+/g, '').trim());  
    
        return ingredients.join(', ');
      }
    
      return '';
    }
    
    const nonVeganIngredientsSet = new Set(nonVeganIngredients);
    const nonVeganIngredientsList = Array.from(nonVeganIngredientsSet);
    
    

    return (
      <View style={styles.container}>
      {fetchStatus && (
        <Text style={styles.errorText}>{fetchStatus}</Text>
      )}
      {product ? (
        <>
          <Text style={styles.title}>{productName}</Text>
          <Text style={styles.subtitle}>Орц:</Text>
          <Text style={styles.ingredients}>{getIngredientsText()}</Text>
          {isVegan === null ? (
            <Text style={styles.errorText}>Найрлагыг унших боломжгүй тул веган эсэхийг мэдэх боломжгүй</Text>
          ) : isVegan ? (
            <Text style={[styles.veganStatus, { color: 'green' }]}>Бүтээгдэхүүн веган.</Text>
          ) : (
            <>
              <Text style={[styles.veganStatus, { color: 'red' }]}> Бүтээгдэхүүн веган биш.</Text>
              <Text style={styles.subtitle}>Амьтны гаралтай орц найрлагууд:</Text>
              {nonVeganIngredientsList.map((ingredient, index) => (
                <Text key={index} style={styles.ingredients}>
                  {ingredient}
                </Text>
              ))}
            </>
          )}

        </>
      ) : productName === "Бүтээгдэхүүний мэдээлэл олдсонгүй" ? (
        <Text style={styles.errorText}>{productName}</Text>
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
    </View>
    
    );
      }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ingredients: {
    fontSize: 16,
    marginBottom: 20,
  },
  veganStatus: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default ProductDetailsScreen

